import { randomBytes } from 'crypto'

export interface SAMLConfig {
  entityId: string // SP entity ID (e.g., https://theworktempo.com/saml/metadata)
  acsUrl: string   // Assertion Consumer Service URL
  sloUrl?: string  // Single Logout URL
  idpMetadata: {
    entityId: string
    ssoUrl: string
    sloUrl?: string
    certificate: string // IdP's X.509 certificate for signature verification
  }
  signRequests: boolean
  spPrivateKey?: string
  spCertificate?: string
}

// Generate SAML AuthnRequest (SP-initiated SSO)
export function generateAuthnRequest(config: SAMLConfig): { url: string; requestId: string } {
  const requestId = `_${randomBytes(16).toString('hex')}`
  const issueInstant = new Date().toISOString()

  const request = `<samlp:AuthnRequest
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="${requestId}"
    Version="2.0"
    IssueInstant="${issueInstant}"
    Destination="${config.idpMetadata.ssoUrl}"
    AssertionConsumerServiceURL="${config.acsUrl}"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
    <saml:Issuer>${config.entityId}</saml:Issuer>
    <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress" AllowCreate="true"/>
  </samlp:AuthnRequest>`

  const encoded = Buffer.from(request).toString('base64')
  const url = `${config.idpMetadata.ssoUrl}?SAMLRequest=${encodeURIComponent(encoded)}&RelayState=${encodeURIComponent(config.acsUrl)}`

  return { url, requestId }
}

// Parse SAML Response (from IdP)
export function parseSAMLResponse(samlResponse: string, _config: SAMLConfig): {
  success: boolean
  email?: string
  nameId?: string
  attributes?: Record<string, string>
  sessionIndex?: string
  error?: string
} {
  try {
    const xml = Buffer.from(samlResponse, 'base64').toString('utf-8')

    // Extract NameID (email)
    const nameIdMatch = xml.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/)
    const email = nameIdMatch?.[1]

    // Extract attributes
    const attributes: Record<string, string> = {}
    const attrRegex = /<saml:Attribute Name="([^"]+)"[^>]*>\s*<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/g
    let match
    while ((match = attrRegex.exec(xml)) !== null) {
      attributes[match[1]] = match[2]
    }

    // Extract session index
    const sessionMatch = xml.match(/SessionIndex="([^"]+)"/)
    const sessionIndex = sessionMatch?.[1]

    // Verify status
    const statusMatch = xml.match(/<samlp:StatusCode Value="([^"]+)"/)
    const status = statusMatch?.[1]

    if (status !== 'urn:oasis:names:tc:SAML:2.0:status:Success') {
      return { success: false, error: `SAML status: ${status}` }
    }

    if (!email) {
      return { success: false, error: 'No NameID (email) in SAML response' }
    }

    // TODO: Verify XML signature against IdP certificate
    // In production, use a proper XML signature verification library

    return { success: true, email, nameId: email, attributes, sessionIndex }
  } catch (err) {
    return { success: false, error: `Failed to parse SAML response: ${err}` }
  }
}

// Generate SP Metadata XML
export function generateSPMetadata(config: SAMLConfig): string {
  return `<?xml version="1.0"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
  entityID="${config.entityId}">
  <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"
    AuthnRequestsSigned="${config.signRequests}" WantAssertionsSigned="true">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="${config.acsUrl}"
      index="0" isDefault="true"/>
    ${config.sloUrl ? `<md:SingleLogoutService
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
      Location="${config.sloUrl}"/>` : ''}
  </md:SPSSODescriptor>
</md:EntityDescriptor>`
}

// Generate Single Logout Request
export function generateLogoutRequest(config: SAMLConfig, nameId: string, sessionIndex?: string): { url: string; requestId: string } {
  const requestId = `_${randomBytes(16).toString('hex')}`
  const issueInstant = new Date().toISOString()
  const sloUrl = config.idpMetadata.sloUrl || config.idpMetadata.ssoUrl

  const request = `<samlp:LogoutRequest
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="${requestId}"
    Version="2.0"
    IssueInstant="${issueInstant}"
    Destination="${sloUrl}">
    <saml:Issuer>${config.entityId}</saml:Issuer>
    <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress">${nameId}</saml:NameID>
    ${sessionIndex ? `<samlp:SessionIndex>${sessionIndex}</samlp:SessionIndex>` : ''}
  </samlp:LogoutRequest>`

  const encoded = Buffer.from(request).toString('base64')
  const url = `${sloUrl}?SAMLRequest=${encodeURIComponent(encoded)}`

  return { url, requestId }
}
