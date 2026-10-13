import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { isSupabaseConfigured, supabaseStore } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed decisions
const defaultDecisions = [
  {
    id: 'dec-cloud-infra-2025',
    userId: 'usr-demo-001',
    title: 'Enterprise Cloud Architecture Modernization',
    description: 'Strategic evaluation of cloud infrastructure migration for core microservices platform handling 45M daily transactions.',
    category: 'Cloud & Infrastructure',
    tags: ['Cloud', 'Infrastructure', 'FinOps', 'Architecture'],
    status: 'evaluated',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    criteria: [
      {
        id: 'crit-tco',
        name: '3-Year TCO CapEx/OpEx',
        description: 'Estimated total cost of ownership including compute, networking, and egress over 36 months',
        type: 'cost',
        weight: 22,
        unit: '$k',
        uncertaintyPct: 15
      },
      {
        id: 'crit-latency',
        name: 'Global P95 Network Latency',
        description: 'Target round-trip latency across APAC, EMEA, and Americas regions',
        type: 'cost',
        weight: 18,
        unit: 'ms',
        uncertaintyPct: 12
      },
      {
        id: 'crit-aiml',
        name: 'AI/ML Ecosystem & GPU Availability',
        description: 'Availability of modern AI accelerator instances, vector DBs, and managed pipeline orchestration',
        type: 'benefit',
        weight: 25,
        unit: 'pts',
        uncertaintyPct: 10
      },
      {
        id: 'crit-compliance',
        name: 'Regulatory Compliance & Data Sovereignty',
        description: 'SOC2 Type II, ISO 27001, HIPAA, and EU GDPR data localization safeguards',
        type: 'benefit',
        weight: 20,
        unit: 'pts',
        uncertaintyPct: 8
      },
      {
        id: 'crit-lockin',
        name: 'Vendor Lock-in Resistance',
        description: 'Portability using open standards, Kubernetes compatibility, and multi-cloud egress friction',
        type: 'benefit',
        weight: 15,
        unit: 'pts',
        uncertaintyPct: 18
      }
    ],
    alternatives: [
      {
        id: 'alt-aws',
        name: 'AWS Enterprise Multi-Region',
        description: 'Amazon Web Services with EKS, Bedrock, Aurora Global Database, and CloudFront CDN.',
        scores: {
          'crit-tco': 420,
          'crit-latency': 32,
          'crit-aiml': 92,
          'crit-compliance': 95,
          'crit-lockin': 48
        },
        pros: ['Deepest global footprint and enterprise compliance certifications', 'Extensive managed services ecosystem and market talent pool'],
        cons: ['Highest data egress fees and aggressive proprietary service lock-in'],
        tags: ['AWS', 'Hyperscaler', 'Mature']
      },
      {
        id: 'alt-gcp',
        name: 'Google Cloud Platform (GCP) AI-First',
        description: 'Google Cloud with GKE Autopilot, Vertex AI, BigQuery, and global Andromeda SDN.',
        scores: {
          'crit-tco': 375,
          'crit-latency': 27,
          'crit-aiml': 97,
          'crit-compliance': 89,
          'crit-lockin': 58
        },
        pros: ['Superior AI acceleration and industry-leading Kubernetes orchestration', 'Private global fiber backbone yielding lowest inter-region latency', '10-15% lower compute costs with sustained use discounts'],
        cons: ['Slightly smaller regional enterprise support footprint in emerging markets'],
        tags: ['GCP', 'AI-Optimized', 'K8s-Native']
      },
      {
        id: 'alt-hybrid',
        name: 'Hybrid Sovereign Cloud (Equinix + Cloud Burst)',
        description: 'Private bare-metal Red Hat OpenShift on Equinix Metal with on-demand hyperscaler burst capacity.',
        scores: {
          'crit-tco': 510,
          'crit-latency': 44,
          'crit-aiml': 73,
          'crit-compliance': 99,
          'crit-lockin': 94
        },
        pros: ['Absolute data sovereignty and total control over hardware and encryption keys', 'Virtually zero vendor lock-in with open-source stack'],
        cons: ['High upfront CapEx and hardware maintenance overhead', 'Steep talent requirement to manage 24/7 on-premise infrastructure'],
        tags: ['Hybrid', 'Sovereign', 'Zero-Lockin']
      }
    ],
    simulationConfig: {
      iterations: 2000,
      confidenceLevel: 95,
      distribution: 'triangular'
    },
    decisionOutcome: {
      selectedAlternativeId: 'alt-gcp',
      rationale: 'GCP AI-First demonstrates superior efficiency across AI acceleration (97 pts) and lowest network latency (27 ms) with a 10.7% lower 3-year TCO ($375k vs $420k) compared to AWS. Sensitivity analysis confirms robust margin of preference.',
      decidedBy: 'Chief Technology Officer (CTO)',
      decidedAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  },
  {
    id: 'dec-ai-inference-2025',
    userId: 'usr-demo-001',
    title: 'Core AI Inference Architecture & LLM Serving',
    description: 'Deciding the enterprise serving stack for real-time customer intelligence and generative copilots.',
    category: 'Architecture & Tech Stack',
    tags: ['GenAI', 'LLM', 'Inference', 'Latency', 'Security'],
    status: 'evaluated',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    criteria: [
      {
        id: 'crit-token-cost',
        name: 'Blended Cost per 1M Tokens',
        description: 'Operational expenditure per 1 million blended input/output tokens',
        type: 'cost',
        weight: 25,
        unit: '$/M-tok',
        uncertaintyPct: 20
      },
      {
        id: 'crit-p99-latency',
        name: 'Time-to-First-Token (TTFT) P99',
        description: 'First token streaming latency under peak 500 QPS load',
        type: 'cost',
        weight: 22,
        unit: 'ms',
        uncertaintyPct: 15
      },
      {
        id: 'crit-data-privacy',
        name: 'Zero-Retention Data Privacy',
        description: 'Guarantees on zero prompt training, tenant isolation, and private VPC enclaves',
        type: 'benefit',
        weight: 28,
        unit: 'pts',
        uncertaintyPct: 5
      },
      {
        id: 'crit-dev-velocity',
        name: 'Time to Ship / Model Swapping Agility',
        description: 'Speed of integrating cutting-edge checkpoint releases and continuous evaluation',
        type: 'benefit',
        weight: 15,
        unit: 'pts',
        uncertaintyPct: 12
      },
      {
        id: 'crit-ops-overhead',
        name: 'DevOps & GPU Cluster Maintenance',
        description: 'Dedicated engineering hours required per month for cluster maintenance',
        type: 'cost',
        weight: 10,
        unit: 'hrs/mo',
        uncertaintyPct: 25
      }
    ],
    alternatives: [
      {
        id: 'alt-managed-api',
        name: 'Commercial Managed API (OpenAI / Claude Tier 4)',
        description: 'Fully managed commercial frontier models with dedicated enterprise SLA and zero data retention agreements.',
        scores: {
          'crit-token-cost': 4.8,
          'crit-p99-latency': 480,
          'crit-data-privacy': 88,
          'crit-dev-velocity': 96,
          'crit-ops-overhead': 8
        },
        pros: ['Instant access to frontier reasoning models without GPU procurement lag', 'Zero infrastructure maintenance or cluster patching'],
        cons: ['Usage scales linearly with volume, vulnerability to provider rate limits and third-party outages'],
        tags: ['Managed', 'Frontier-LLM', 'Zero-Ops']
      },
      {
        id: 'alt-self-hosted',
        name: 'Self-Hosted vLLM on Private GPU Cluster',
        description: 'Open-weights models (Llama 3.3 70B & Qwen 2.5) running on dedicated NVIDIA H100 instances orchestrated with vLLM and TensorRT-LLM.',
        scores: {
          'crit-token-cost': 1.6,
          'crit-p99-latency': 220,
          'crit-data-privacy': 99,
          'crit-dev-velocity': 74,
          'crit-ops-overhead': 65
        },
        pros: ['Lowest marginal token cost at high enterprise scale (66% cost savings)', 'Unrivaled P99 TTFT latency and full cryptographic control over weights'],
        cons: ['Fixed hardware reservation cost and significant DevOps overhead for high availability'],
        tags: ['Self-Hosted', 'vLLM', 'High-Scale']
      },
      {
        id: 'alt-hybrid-router',
        name: 'Smart Semantic Gateway & Fallback Router',
        description: 'Route 80% commodity queries to local quantized models (Llama 8B) and automatically escalate complex queries to frontier APIs.',
        scores: {
          'crit-token-cost': 2.2,
          'crit-p99-latency': 290,
          'crit-data-privacy': 93,
          'crit-dev-velocity': 89,
          'crit-ops-overhead': 28
        },
        pros: ['Best of both worlds: low baseline cost with safety valve for frontier reasoning', 'Graceful failover and multi-provider redundancy'],
        cons: ['Slightly higher routing logic complexity and calibration requirements'],
        tags: ['Hybrid', 'Router', 'Optimized']
      }
    ],
    simulationConfig: {
      iterations: 2000,
      confidenceLevel: 95,
      distribution: 'triangular'
    }
  },
  {
    id: 'dec-vendor-procurement-2025',
    userId: 'usr-demo-001',
    title: 'Enterprise ERP & Financial Operations Platform',
    description: 'Procurement selection for global financial operations consolidation across 12 multinational entities.',
    category: 'Vendor & Procurement',
    tags: ['ERP', 'Finance', 'Procurement', 'Operations'],
    status: 'draft',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    criteria: [
      {
        id: 'crit-capex',
        name: 'Total Implementation & Licensing Cost',
        description: 'Year 1 licensing plus systems integration consultant fees',
        type: 'cost',
        weight: 25,
        unit: '$k',
        uncertaintyPct: 20
      },
      {
        id: 'crit-time2val',
        name: 'Deployment Timeline to Go-Live',
        description: 'Target calendar months to fully operational multi-currency rollout',
        type: 'cost',
        weight: 20,
        unit: 'months',
        uncertaintyPct: 25
      },
      {
        id: 'crit-ecosystem',
        name: 'API Extensibility & Integration Ecosystem',
        description: 'Pre-built connectors to Salesforce, Workday, Stripe, and modern REST/GraphQL APIs',
        type: 'benefit',
        weight: 25,
        unit: 'pts',
        uncertaintyPct: 10
      },
      {
        id: 'crit-compliance-erp',
        name: 'Multi-Jurisdictional Tax Compliance',
        description: 'Automated VAT/GST calculation, statutory reporting, and audit trail certification',
        type: 'benefit',
        weight: 20,
        unit: 'pts',
        uncertaintyPct: 5
      },
      {
        id: 'crit-csat',
        name: 'User Experience & Finance Team CSAT',
        description: 'Usability benchmarking score from pilot accounting and billing teams',
        type: 'benefit',
        weight: 10,
        unit: 'pts',
        uncertaintyPct: 15
      }
    ],
    alternatives: [
      {
        id: 'alt-sap',
        name: 'SAP S/4HANA Cloud Public Edition',
        description: 'Market benchmark for enterprise ERP with deep global localization and financial governance.',
        scores: {
          'crit-capex': 890,
          'crit-time2val': 14,
          'crit-ecosystem': 82,
          'crit-compliance-erp': 98,
          'crit-csat': 68
        },
        pros: ['Gold standard statutory compliance across 150+ countries', 'Robust audit trails and enterprise treasury capabilities'],
        cons: ['Long implementation cycle and complex legacy interface requiring specialized training'],
        tags: ['SAP', 'Enterprise-Standard', 'Global']
      },
      {
        id: 'alt-netsuite',
        name: 'Oracle NetSuite SuiteCloud',
        description: 'Proven mid-to-enterprise multi-subsidiary cloud ERP with fast onboarding and custom scripting.',
        scores: {
          'crit-capex': 540,
          'crit-time2val': 8,
          'crit-ecosystem': 91,
          'crit-compliance-erp': 90,
          'crit-csat': 84
        },
        pros: ['Rapid deployment time (8 months) with lower integration friction', 'High finance team satisfaction and agile workflow scripting'],
        cons: ['Requires third-party add-ons for specialized local statutory tax filings in niche territories'],
        tags: ['NetSuite', 'Cloud-Native', 'Agile']
      },
      {
        id: 'alt-dynamics',
        name: 'Microsoft Dynamics 365 Finance',
        description: 'Unified finance and operations integrated with Microsoft 365, Power BI, and Azure Copilot.',
        scores: {
          'crit-capex': 620,
          'crit-time2val': 10,
          'crit-ecosystem': 94,
          'crit-compliance-erp': 92,
          'crit-csat': 86
        },
        pros: ['Seamless integration with existing Microsoft 365 and Power Automate workflows', 'Native Power BI analytics and Copilot assistance'],
        cons: ['Partner-dependent implementation variability and licensing tier complexity'],
        tags: ['Microsoft', 'PowerPlatform', 'Integrated']
      }
    ],
    simulationConfig: {
      iterations: 1500,
      confidenceLevel: 95,
      distribution: 'triangular'
    }
  }
];

class Store {
  constructor() {
    this.users = [];
    this.decisions = [];
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.users = data.users || [];
        this.decisions = data.decisions || [];
      } else {
        this.seed();
      }
    } catch (err) {
      console.warn('Error reading db.json, re-seeding default database:', err.message);
      this.seed();
    }

    // Ensure demo user exists
    const demoUser = this.users.find(u => u.email === 'demo@stratagem.ai');
    if (!demoUser) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync('StratagemDemo2025!', salt);
      this.users.push({
        id: 'usr-demo-001',
        name: 'Alex Vance',
        email: 'demo@stratagem.ai',
        password: hashedPassword,
        organization: 'Apex Decision Technologies',
        role: 'Chief Decision Architect',
        createdAt: new Date().toISOString()
      });
      this.save();
    }
  }

  seed() {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync('StratagemDemo2025!', salt);
    this.users = [
      {
        id: 'usr-demo-001',
        name: 'Alex Vance',
        email: 'demo@stratagem.ai',
        password: hashedPassword,
        organization: 'Apex Decision Technologies',
        role: 'Chief Decision Architect',
        createdAt: new Date().toISOString()
      }
    ];
    this.decisions = defaultDecisions;
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify({
        users: this.users,
        decisions: this.decisions
      }, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist db.json:', err);
    }
  }

  // Users methods
  async findUserByEmail(email) {
    if (isSupabaseConfigured()) {
      try {
        const user = await supabaseStore.findUserByEmail(email);
        if (user) return user;
      } catch (err) {
        console.warn('[Supabase] Remote query error, falling back to local store:', err.message);
      }
    }
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async findUserById(id) {
    if (isSupabaseConfigured()) {
      try {
        const user = await supabaseStore.findUserById(id);
        if (user) return user;
      } catch (err) {
        console.warn('[Supabase] Remote query error, falling back to local store:', err.message);
      }
    }
    return this.users.find(u => u.id === id);
  }

  async createUser(userData) {
    if (isSupabaseConfigured()) {
      try {
        const user = await supabaseStore.createUser(userData);
        if (user) return user;
      } catch (err) {
        console.warn('[Supabase] Table not yet created, saving to local store:', err.message);
      }
    }
    this.users.push(userData);
    this.save();
    return userData;
  }

  // Decisions methods
  async findDecisionsByUser(userId) {
    if (isSupabaseConfigured()) {
      try {
        const list = await supabaseStore.findDecisionsByUser(userId);
        if (list && list.length > 0) return list;
      } catch (err) {
        console.warn('[Supabase] Remote query error, falling back to local store:', err.message);
      }
    }
    return this.decisions.filter(d => d.userId === userId);
  }

  async findDecisionById(id, userId) {
    if (isSupabaseConfigured()) {
      try {
        const d = await supabaseStore.findDecisionById(id, userId);
        if (d) return d;
      } catch (err) {
        console.warn('[Supabase] Remote query error, falling back to local store:', err.message);
      }
    }
    return this.decisions.find(d => d.id === id && (!userId || d.userId === userId));
  }

  async createDecision(decisionData) {
    if (isSupabaseConfigured()) {
      try {
        const d = await supabaseStore.createDecision(decisionData);
        if (d) return d;
      } catch (err) {
        console.warn('[Supabase] Remote query error, falling back to local store:', err.message);
      }
    }
    this.decisions.unshift(decisionData);
    this.save();
    return decisionData;
  }

  async updateDecision(id, userId, updates) {
    if (isSupabaseConfigured()) {
      try {
        const d = await supabaseStore.updateDecision(id, userId, updates);
        if (d) return d;
      } catch (err) {
        console.warn('[Supabase] Remote query error, falling back to local store:', err.message);
      }
    }
    const index = this.decisions.findIndex(d => d.id === id && d.userId === userId);
    if (index === -1) return null;
    this.decisions[index] = {
      ...this.decisions[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.decisions[index];
  }

  async deleteDecision(id, userId) {
    if (isSupabaseConfigured()) {
      try {
        const ok = await supabaseStore.deleteDecision(id, userId);
        if (ok) return ok;
      } catch (err) {
        console.warn('[Supabase] Remote query error, falling back to local store:', err.message);
      }
    }
    const initialLen = this.decisions.length;
    this.decisions = this.decisions.filter(d => !(d.id === id && d.userId === userId));
    const deleted = this.decisions.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }
}

export const db = new Store();
