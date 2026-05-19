import { mongoose } from '../services/mongodb.js'

const ProductSnapshot = new mongoose.Schema({
  site: String,
  url: String,
  title: String,
  brand: String,
  price_current: Number,
  price_mrp: Number,
  currency: { type: String, default: 'INR' },
  image: String,
  rating_avg: Number,
  rating_count: Number,
  seller_name: String,
  seller_age_days: Number,
  delivery_estimate: String,
  similarity_score: Number,
  trust_score: Number,
  verdict: String,
  is_suspicious: Boolean,
  discount_pct: Number,
}, { _id: false })

const ComparisonSchema = new mongoose.Schema({
  _id: String,
  sourceUrl: String,
  sourceProduct: ProductSnapshot,
  matches: [ProductSnapshot],
  aiRecommendation: mongoose.Schema.Types.Mixed,
  comparedAt: { type: Date, default: Date.now },
  // TTL index: auto-delete after 24 hours
  expiresAt: { type: Date, default: () => new Date(Date.now() + 86400 * 1000), index: { expireAfterSeconds: 0 } },
})

// Avoid model recompilation on hot reload
export default mongoose.models?.Comparison
  ?? mongoose.model('Comparison', ComparisonSchema)
