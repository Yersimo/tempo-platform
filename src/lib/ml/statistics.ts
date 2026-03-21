/**
 * Tempo ML Statistics Library
 * Pure TypeScript implementations of statistical/ML algorithms.
 * No external dependencies — runs in any JS environment.
 */

// ────────────────────────────────────────────────────────────
//  Linear Regression (Ordinary Least Squares)
// ────────────────────────────────────────────────────────────

export interface LinearRegressionResult {
  slope: number
  intercept: number
  r2: number
  predict: (x: number) => number
  standardError: number
}

export function linearRegression(data: { x: number; y: number }[]): LinearRegressionResult {
  const n = data.length
  if (n < 2) return { slope: 0, intercept: data[0]?.y ?? 0, r2: 0, predict: () => data[0]?.y ?? 0, standardError: 0 }

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (const { x, y } of data) {
    sumX += x
    sumY += y
    sumXY += x * y
    sumX2 += x * x
  }

  const denom = n * sumX2 - sumX * sumX
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  // R-squared
  const yMean = sumY / n
  let ssTot = 0, ssRes = 0
  for (const { x, y } of data) {
    const yPred = slope * x + intercept
    ssTot += (y - yMean) ** 2
    ssRes += (y - yPred) ** 2
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot

  // Standard error of the estimate
  const standardError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0

  return {
    slope,
    intercept,
    r2,
    predict: (x: number) => slope * x + intercept,
    standardError,
  }
}

// ────────────────────────────────────────────────────────────
//  Multiple Linear Regression
// ────────────────────────────────────────────────────────────

export interface MultipleRegressionResult {
  weights: number[]       // [intercept, w1, w2, ...]
  r2: number
  predict: (features: number[]) => number
  featureImportance: number[]
}

export function multipleLinearRegression(
  features: number[][],
  target: number[]
): MultipleRegressionResult {
  const n = features.length
  const p = features[0]?.length ?? 0
  if (n < p + 1) {
    return { weights: new Array(p + 1).fill(0), r2: 0, predict: () => 0, featureImportance: new Array(p).fill(0) }
  }

  // Add intercept column (1s)
  const X = features.map(row => [1, ...row])
  const y = target

  // Normal equation: w = (X^T X)^{-1} X^T y
  const cols = p + 1
  const XtX = Array.from({ length: cols }, () => new Array(cols).fill(0))
  const Xty = new Array(cols).fill(0)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < cols; j++) {
      Xty[j] += X[i][j] * y[i]
      for (let k = 0; k < cols; k++) {
        XtX[j][k] += X[i][j] * X[i][k]
      }
    }
  }

  // Gaussian elimination with partial pivoting
  const aug = XtX.map((row, i) => [...row, Xty[i]])
  for (let col = 0; col < cols; col++) {
    // Pivot
    let maxRow = col
    for (let row = col + 1; row < cols; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row
    }
    ;[aug[col], aug[maxRow]] = [aug[maxRow], aug[col]]

    const pivot = aug[col][col]
    if (Math.abs(pivot) < 1e-12) continue
    for (let j = col; j <= cols; j++) aug[col][j] /= pivot
    for (let row = 0; row < cols; row++) {
      if (row === col) continue
      const factor = aug[row][col]
      for (let j = col; j <= cols; j++) aug[row][j] -= factor * aug[col][j]
    }
  }

  const weights = aug.map(row => row[cols])

  // R-squared
  const yMean = y.reduce((a, b) => a + b, 0) / n
  let ssTot = 0, ssRes = 0
  for (let i = 0; i < n; i++) {
    let pred = weights[0]
    for (let j = 0; j < p; j++) pred += weights[j + 1] * features[i][j]
    ssTot += (y[i] - yMean) ** 2
    ssRes += (y[i] - pred) ** 2
  }
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot)

  // Feature importance: absolute standardized weights
  const featureStds = Array.from({ length: p }, (_, j) => {
    const vals = features.map(row => row[j])
    const m = vals.reduce((a, b) => a + b, 0) / n
    return Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / n) || 1
  })
  const rawImportance = weights.slice(1).map((w, i) => Math.abs(w * featureStds[i]))
  const totalImportance = rawImportance.reduce((a, b) => a + b, 0) || 1
  const featureImportance = rawImportance.map(v => v / totalImportance)

  return {
    weights,
    r2,
    predict: (f: number[]) => weights[0] + f.reduce((s, v, i) => s + v * (weights[i + 1] || 0), 0),
    featureImportance,
  }
}

// ────────────────────────────────────────────────────────────
//  Logistic Regression (Gradient Descent)
// ────────────────────────────────────────────────────────────

export interface LogisticRegressionResult {
  weights: number[]
  predict: (features: number[]) => number
  iterations: number
}

function sigmoid(z: number): number {
  if (z > 500) return 1
  if (z < -500) return 0
  return 1 / (1 + Math.exp(-z))
}

export function logisticRegression(
  features: number[][],
  labels: number[],
  learningRate = 0.01,
  iterations = 100
): LogisticRegressionResult {
  const n = features.length
  const p = features[0]?.length ?? 0
  if (n === 0) return { weights: [], predict: () => 0.5, iterations: 0 }

  // Normalize features for stability
  const means = new Array(p).fill(0)
  const stds = new Array(p).fill(1)
  for (let j = 0; j < p; j++) {
    let sum = 0
    for (let i = 0; i < n; i++) sum += features[i][j]
    means[j] = sum / n
    let variance = 0
    for (let i = 0; i < n; i++) variance += (features[i][j] - means[j]) ** 2
    stds[j] = Math.sqrt(variance / n) || 1
  }

  const normFeatures = features.map(row => row.map((v, j) => (v - means[j]) / stds[j]))

  // Add bias term
  const weights = new Array(p + 1).fill(0)

  for (let iter = 0; iter < iterations; iter++) {
    const gradients = new Array(p + 1).fill(0)
    for (let i = 0; i < n; i++) {
      let z = weights[0] // bias
      for (let j = 0; j < p; j++) z += weights[j + 1] * normFeatures[i][j]
      const pred = sigmoid(z)
      const error = pred - labels[i]
      gradients[0] += error
      for (let j = 0; j < p; j++) gradients[j + 1] += error * normFeatures[i][j]
    }
    for (let j = 0; j <= p; j++) {
      weights[j] -= (learningRate / n) * gradients[j]
    }
  }

  return {
    weights,
    predict: (rawFeatures: number[]) => {
      const norm = rawFeatures.map((v, j) => (v - means[j]) / stds[j])
      let z = weights[0]
      for (let j = 0; j < p; j++) z += weights[j + 1] * norm[j]
      return sigmoid(z)
    },
    iterations,
  }
}

// ────────────────────────────────────────────────────────────
//  Time Series Forecasting (Holt-Winters Double Exponential Smoothing)
// ────────────────────────────────────────────────────────────

export interface TimeSeriesForecast {
  forecast: number[]
  confidence: { upper: number[]; lower: number[] }
  trend: number
  level: number
}

export function forecastTimeSeries(
  data: number[],
  periods: number,
  alpha = 0.3,
  beta = 0.1
): TimeSeriesForecast {
  const n = data.length
  if (n === 0) return { forecast: new Array(periods).fill(0), confidence: { upper: new Array(periods).fill(0), lower: new Array(periods).fill(0) }, trend: 0, level: 0 }
  if (n === 1) {
    const v = data[0]
    return { forecast: new Array(periods).fill(v), confidence: { upper: new Array(periods).fill(v), lower: new Array(periods).fill(v) }, trend: 0, level: v }
  }

  // Initialize
  let level = data[0]
  let trend = data[1] - data[0]

  // Fit on historical data
  const residuals: number[] = []
  for (let i = 1; i < n; i++) {
    const prevLevel = level
    level = alpha * data[i] + (1 - alpha) * (prevLevel + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
    residuals.push(data[i] - (prevLevel + trend))
  }

  // Residual standard deviation for confidence intervals
  const residualStd = residuals.length > 0
    ? Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length)
    : 0

  // Forecast
  const forecast: number[] = []
  const upper: number[] = []
  const lower: number[] = []
  for (let h = 1; h <= periods; h++) {
    const point = level + trend * h
    const interval = 1.96 * residualStd * Math.sqrt(h) // 95% CI
    forecast.push(point)
    upper.push(point + interval)
    lower.push(Math.max(0, point - interval))
  }

  return { forecast, confidence: { upper, lower }, trend, level }
}

// ────────────────────────────────────────────────────────────
//  Anomaly Detection (Z-Score)
// ────────────────────────────────────────────────────────────

export interface Anomaly {
  index: number
  value: number
  zScore: number
}

export function detectAnomalies(data: number[], threshold = 2.0): Anomaly[] {
  const n = data.length
  if (n < 3) return []

  const mean = data.reduce((a, b) => a + b, 0) / n
  const std = Math.sqrt(data.reduce((s, v) => s + (v - mean) ** 2, 0) / n)
  if (std === 0) return []

  const anomalies: Anomaly[] = []
  for (let i = 0; i < n; i++) {
    const zScore = (data[i] - mean) / std
    if (Math.abs(zScore) > threshold) {
      anomalies.push({ index: i, value: data[i], zScore })
    }
  }

  return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
}

// ────────────────────────────────────────────────────────────
//  K-Means Clustering
// ────────────────────────────────────────────────────────────

export interface ClusteringResult {
  clusters: number[]
  centroids: number[][]
  iterations: number
}

export function kMeansClustering(
  data: number[][],
  k: number,
  maxIterations = 50
): ClusteringResult {
  const n = data.length
  const dims = data[0]?.length ?? 0
  if (n === 0 || k <= 0) return { clusters: [], centroids: [], iterations: 0 }
  if (k >= n) return { clusters: data.map((_, i) => i), centroids: data.slice(0, k), iterations: 0 }

  // Initialize centroids using k-means++ style (spread out picks)
  const centroids: number[][] = []
  const usedIndices = new Set<number>()
  centroids.push([...data[0]])
  usedIndices.add(0)

  for (let c = 1; c < k; c++) {
    // Pick point farthest from nearest centroid (deterministic greedy)
    let bestIdx = 0, bestDist = -1
    for (let i = 0; i < n; i++) {
      if (usedIndices.has(i)) continue
      let minDist = Infinity
      for (const centroid of centroids) {
        let d = 0
        for (let j = 0; j < dims; j++) d += (data[i][j] - centroid[j]) ** 2
        minDist = Math.min(minDist, d)
      }
      if (minDist > bestDist) { bestDist = minDist; bestIdx = i }
    }
    centroids.push([...data[bestIdx]])
    usedIndices.add(bestIdx)
  }

  let clusters = new Array(n).fill(0)
  let iter = 0

  for (; iter < maxIterations; iter++) {
    // Assignment
    const newClusters = new Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      let minDist = Infinity
      for (let c = 0; c < k; c++) {
        let d = 0
        for (let j = 0; j < dims; j++) d += (data[i][j] - centroids[c][j]) ** 2
        if (d < minDist) { minDist = d; newClusters[i] = c }
      }
    }

    // Check convergence
    let changed = false
    for (let i = 0; i < n; i++) {
      if (newClusters[i] !== clusters[i]) { changed = true; break }
    }
    clusters = newClusters
    if (!changed) break

    // Update centroids
    const counts = new Array(k).fill(0)
    const sums = Array.from({ length: k }, () => new Array(dims).fill(0))
    for (let i = 0; i < n; i++) {
      const c = clusters[i]
      counts[c]++
      for (let j = 0; j < dims; j++) sums[c][j] += data[i][j]
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] === 0) continue
      for (let j = 0; j < dims; j++) centroids[c][j] = sums[c][j] / counts[c]
    }
  }

  return { clusters, centroids, iterations: iter }
}

// ────────────────────────────────────────────────────────────
//  Correlation Matrix
// ────────────────────────────────────────────────────────────

export function correlationMatrix(
  variables: Record<string, number[]>
): Record<string, Record<string, number>> {
  const keys = Object.keys(variables)
  const result: Record<string, Record<string, number>> = {}

  for (const a of keys) {
    result[a] = {}
    for (const b of keys) {
      result[a][b] = pearsonCorrelation(variables[a], variables[b])
    }
  }

  return result
}

export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0
  for (let i = 0; i < n; i++) {
    sumX += x[i]
    sumY += y[i]
    sumXY += x[i] * y[i]
    sumX2 += x[i] ** 2
    sumY2 += y[i] ** 2
  }

  const num = n * sumXY - sumX * sumY
  const den = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2))
  return den === 0 ? 0 : num / den
}

// ────────────────────────────────────────────────────────────
//  Moving Average
// ────────────────────────────────────────────────────────────

export function movingAverage(data: number[], window: number): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1)
    const slice = data.slice(start, i + 1)
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length)
  }
  return result
}

// ────────────────────────────────────────────────────────────
//  Percentile / Quantile
// ────────────────────────────────────────────────────────────

export function percentile(data: number[], p: number): number {
  if (data.length === 0) return 0
  const sorted = [...data].sort((a, b) => a - b)
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

// ────────────────────────────────────────────────────────────
//  Standard Deviation & Variance
// ────────────────────────────────────────────────────────────

export function mean(data: number[]): number {
  if (data.length === 0) return 0
  return data.reduce((a, b) => a + b, 0) / data.length
}

export function standardDeviation(data: number[]): number {
  const n = data.length
  if (n < 2) return 0
  const m = mean(data)
  return Math.sqrt(data.reduce((s, v) => s + (v - m) ** 2, 0) / n)
}
