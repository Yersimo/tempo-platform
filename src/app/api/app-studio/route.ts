import { NextRequest, NextResponse } from 'next/server'
import {
  createApp,
  updateApp,
  publishApp,
  archiveApp,
  createPage,
  updatePage,
  deletePage,
  addComponent,
  updateComponent,
  deleteComponent,
  createDataSource,
  updateDataSource,
  refreshDataSource,
  previewApp,
  cloneApp,
  exportApp,
  importApp,
  getAppAnalytics,
  validateApp,
  getComponentLibrary,
  generateAppFromTemplate,
  getAppTemplates,
} from '@/lib/services/app-studio'

// GET /api/app-studio - Preview apps, get component library, templates, analytics
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'templates'

    switch (action) {
      case 'templates':
        return NextResponse.json({ templates: getAppTemplates() })

      case 'components':
        return NextResponse.json({ components: getComponentLibrary() })

      case 'preview': {
        const appId = url.searchParams.get('appId')
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const result = await previewApp(orgId, appId)
        return NextResponse.json(result)
      }

      case 'analytics': {
        const appId = url.searchParams.get('appId')
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const result = await getAppAnalytics(orgId, appId)
        return NextResponse.json(result)
      }

      case 'validate': {
        const appId = url.searchParams.get('appId')
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const result = await validateApp(orgId, appId)
        return NextResponse.json(result)
      }

      case 'export': {
        const appId = url.searchParams.get('appId')
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const result = await exportApp(orgId, appId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[GET /api/app-studio] Error:', error)
    return NextResponse.json({ error: error?.message || 'App Studio query failed' }, { status: 500 })
  }
}

// POST /api/app-studio - Create/update apps, pages, components, data sources
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      // App operations
      case 'create-app': {
        const { name, description, icon, slug, createdBy, accessRoles, theme, settings } = body
        if (!name || !createdBy) return NextResponse.json({ error: 'name and createdBy are required' }, { status: 400 })
        const result = await createApp(orgId, { name, description, icon, slug: slug || name, createdBy, accessRoles, theme, settings })
        return NextResponse.json(result)
      }

      case 'update-app': {
        const { appId, ...updates } = body
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const result = await updateApp(orgId, appId, updates)
        return NextResponse.json(result)
      }

      case 'publish-app': {
        const { appId, publishedBy } = body
        if (!appId || !publishedBy) return NextResponse.json({ error: 'appId and publishedBy are required' }, { status: 400 })
        const result = await publishApp(orgId, appId, publishedBy)
        return NextResponse.json(result)
      }

      case 'archive-app': {
        const { appId } = body
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const result = await archiveApp(orgId, appId)
        return NextResponse.json(result)
      }

      case 'clone-app': {
        const { appId, newName, createdBy } = body
        if (!appId || !newName || !createdBy) return NextResponse.json({ error: 'appId, newName, and createdBy are required' }, { status: 400 })
        const result = await cloneApp(orgId, appId, newName, createdBy)
        return NextResponse.json(result)
      }

      case 'import-app': {
        const { exportData, createdBy } = body
        if (!exportData || !createdBy) return NextResponse.json({ error: 'exportData and createdBy are required' }, { status: 400 })
        const result = await importApp(orgId, createdBy, exportData)
        return NextResponse.json(result)
      }

      case 'generate-from-template': {
        const { templateId, createdBy } = body
        if (!templateId || !createdBy) return NextResponse.json({ error: 'templateId and createdBy are required' }, { status: 400 })
        const result = await generateAppFromTemplate(orgId, templateId, createdBy)
        return NextResponse.json(result)
      }

      // Page operations
      case 'create-page': {
        const { appId, name, slug, layout, isHomePage, orderIndex, icon } = body
        if (!appId || !name) return NextResponse.json({ error: 'appId and name are required' }, { status: 400 })
        const result = await createPage(orgId, { appId, name, slug: slug || name, layout, isHomePage, orderIndex, icon })
        return NextResponse.json(result)
      }

      case 'update-page': {
        const { pageId, ...updates } = body
        if (!pageId) return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
        const result = await updatePage(orgId, pageId, updates)
        return NextResponse.json(result)
      }

      case 'delete-page': {
        const { pageId } = body
        if (!pageId) return NextResponse.json({ error: 'pageId is required' }, { status: 400 })
        const result = await deletePage(orgId, pageId)
        return NextResponse.json(result)
      }

      // Component operations
      case 'add-component': {
        const { pageId, type, label, config, dataSourceId, position, orderIndex, conditionalVisibility, style } = body
        if (!pageId || !type || !config) return NextResponse.json({ error: 'pageId, type, and config are required' }, { status: 400 })
        const result = await addComponent(orgId, { pageId, type, label, config, dataSourceId, position, orderIndex, conditionalVisibility, style })
        return NextResponse.json(result)
      }

      case 'update-component': {
        const { componentId, ...updates } = body
        if (!componentId) return NextResponse.json({ error: 'componentId is required' }, { status: 400 })
        const result = await updateComponent(orgId, componentId, updates)
        return NextResponse.json(result)
      }

      case 'delete-component': {
        const { componentId } = body
        if (!componentId) return NextResponse.json({ error: 'componentId is required' }, { status: 400 })
        const result = await deleteComponent(orgId, componentId)
        return NextResponse.json(result)
      }

      // Data source operations
      case 'create-data-source': {
        const { appId, name, type, config: dsConfig, schema: dsSchema, refreshInterval } = body
        if (!appId || !name || !type || !dsConfig) return NextResponse.json({ error: 'appId, name, type, and config are required' }, { status: 400 })
        const result = await createDataSource(orgId, { appId, name, type, config: dsConfig, schema: dsSchema, refreshInterval })
        return NextResponse.json(result)
      }

      case 'update-data-source': {
        const { dataSourceId, ...updates } = body
        if (!dataSourceId) return NextResponse.json({ error: 'dataSourceId is required' }, { status: 400 })
        const result = await updateDataSource(orgId, dataSourceId, updates)
        return NextResponse.json(result)
      }

      case 'refresh-data-source': {
        const { dataSourceId } = body
        if (!dataSourceId) return NextResponse.json({ error: 'dataSourceId is required' }, { status: 400 })
        const result = await refreshDataSource(orgId, dataSourceId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/app-studio] Error:', error)
    return NextResponse.json({ error: error?.message || 'App Studio operation failed' }, { status: 500 })
  }
}
