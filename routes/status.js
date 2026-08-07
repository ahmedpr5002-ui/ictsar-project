const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// ==========================================
// 1. Mongoose Schemas & Model
// ==========================================
const localizedMessageSchema = new mongoose.Schema(
  {
    ar: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const platformConfigSchema = new mongoose.Schema(
  {
    minSupportedVersion: {
      type: String,
      required: true,
      default: '1.0.0',
      match: [/^\d+\.\d+\.\d+$/, 'Invalid semver format (e.g. 1.0.0)']
    },
    latestVersion: {
      type: String,
      required: true,
      default: '1.0.0',
      match: [/^\d+\.\d+\.\d+$/, 'Invalid semver format (e.g. 1.0.0)']
    },
    storeUrl: { type: String, required: true, trim: true },
    maintenance: {
      enabled: { type: Boolean, default: false }
    }
  },
  { _id: false }
);

const appConfigSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global_app_config'
    },
    maintenance: {
      globalEnabled: { type: Boolean, default: false },
      message: {
        type: localizedMessageSchema,
        default: {
          ar: 'التطبيق قيد الصيانة حالياً، يرجى المحاولة لاحقاً.',
          en: 'The app is currently under maintenance, please try again later.'
        }
      },
      expectedEndTime: { type: Date, default: null },
      bypassedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      bypassedRoles: [{ type: String, enum: ['admin', 'tester', 'developer'], default: ['admin'] }]
    },
    platforms: {
      android: {
        type: platformConfigSchema,
        default: () => ({
          minSupportedVersion: '1.0.0',
          latestVersion: '1.0.0',
          storeUrl: 'https://play.google.com/store/apps/details?id=com.example.app',
          maintenance: { enabled: false }
        })
      },
      ios: {
        type: platformConfigSchema,
        default: () => ({
          minSupportedVersion: '1.0.0',
          latestVersion: '1.0.0',
          storeUrl: 'https://apps.apple.com/app/id123456789',
          maintenance: { enabled: false }
        })
      }
    },
    featureFlags: {
      type: Map,
      of: Boolean,
      default: {}
    }
  },
  { timestamps: true }
);

// Singleton Static Method
appConfigSchema.statics.getSingletonInstance = async function () {
  let config = await this.findOne({ key: 'global_app_config' });
  if (!config) {
    config = await this.create({ key: 'global_app_config' });
  }
  return config;
};

// حماية لمنع إعادة تعريف الموديل في حال تكرار الاستدعاء
const AppConfig = mongoose.models.AppConfig || mongoose.model('AppConfig', appConfigSchema);

// ==========================================
// 2. Helper Functions
// ==========================================
const compareSemver = (v1, v2) => {
  const cleanV1 = (v1 || '').split('-')[0];
  const cleanV2 = (v2 || '').split('-')[0];

  const p1 = cleanV1.split('.').map(Number);
  const p2 = cleanV2.split('.').map(Number);

  const maxLength = Math.max(p1.length, p2.length);

  for (let i = 0; i < maxLength; i++) {
    const num1 = p1[i] || 0;
    const num2 = p2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
};

// ==========================================
// 3. Middlewares (Optional Auth & Admin Check)
// ==========================================
const optionalAuth = (req, res, next) => {
  // يمكنك قراءة التوكين هنا وتمرير req.user إن وجد
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  // يمكنك توقيف التحقق مؤقتاً للتجربة أو إبقائه حسب نظام Auth لديك
  next();
};

// ==========================================
// 4. Controllers & Routes
// ==========================================

/**
 * @route   GET /api/v1/app/status (أو حسب الـ Prefix في app.js)
 * @desc    Public Endpoint for Mobile App Status
 */
router.get('/app/status', optionalAuth, async (req, res) => {
  try {
    const platform = (req.headers['x-platform'] || req.query.platform || '').toLowerCase();
    const clientVersion = req.headers['x-app-version'] || req.query.version;
    const acceptLanguage = req.headers['accept-language'] || 'ar';
    const lang = acceptLanguage.startsWith('en') ? 'en' : 'ar';

    if (!['android', 'ios'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing platform (x-platform header or query must be android or ios).'
      });
    }

    if (!clientVersion || !/^\d+\.\d+\.\d+$/.test(clientVersion)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing app version (x-app-version header or query must follow x.y.z format).'
      });
    }

    const config = await AppConfig.getSingletonInstance();
    const platformData = config.platforms[platform];

    // 1. فحص وضع الصيانة
    const isGlobalMaintenance = config.maintenance.globalEnabled;
    const isPlatformMaintenance = platformData.maintenance.enabled;
    let isUnderMaintenance = isGlobalMaintenance || isPlatformMaintenance;

    // استثناء المستخدمين أو الأدوار
    if (isUnderMaintenance && req.user) {
      const isUserIdBypassed = config.maintenance.bypassedUserIds.some(
        (id) => id.toString() === req.user._id.toString()
      );
      const isRoleBypassed = config.maintenance.bypassedRoles.includes(req.user.role);

      if (isUserIdBypassed || isRoleBypassed) {
        isUnderMaintenance = false;
      }
    }

    if (isUnderMaintenance) {
      return res.status(200).json({
        success: true,
        data: {
          isMaintenance: true,
          message: config.maintenance.message[lang] || config.maintenance.message.ar,
          expectedEndTime: config.maintenance.expectedEndTime,
          updateRequired: false,
          isForceUpdate: false,
          storeUrl: platformData.storeUrl,
          featureFlags: {}
        }
      });
    }

    // 2. فحص الإصدارات والتحديث الإجباري / الاختياري
    const minVersion = platformData.minSupportedVersion;
    const latestVersion = platformData.latestVersion;

    const isBelowMin = compareSemver(clientVersion, minVersion) < 0;
    const isBelowLatest = compareSemver(clientVersion, latestVersion) < 0;

    const isForceUpdate = isBelowMin;
    const updateRequired = isBelowMin || isBelowLatest;

    return res.status(200).json({
      success: true,
      data: {
        isMaintenance: false,
        updateRequired,
        isForceUpdate,
        currentClientVersion: clientVersion,
        minSupportedVersion: minVersion,
        latestVersion,
        storeUrl: platformData.storeUrl,
        featureFlags: Object.fromEntries(config.featureFlags || new Map())
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching app status.',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/v1/admin/app-config
 * @desc    Get complete config for Admin Dashboard
 */
router.get('/admin/app-config', requireAdmin, async (req, res) => {
  try {
    const config = await AppConfig.getSingletonInstance();
    return res.status(200).json({
      success: true,
      data: config
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching admin config.',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/v1/admin/app-config
 * @desc    Update config from Admin Dashboard
 */
router.patch('/admin/app-config', requireAdmin, async (req, res) => {
  try {
    const config = await AppConfig.getSingletonInstance();

    const allowedUpdates = ['maintenance', 'platforms', 'featureFlags'];
    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (key === 'featureFlags' && typeof req.body.featureFlags === 'object') {
          config.featureFlags = new Map(Object.entries(req.body.featureFlags));
        } else {
          config[key] = { ...config[key], ...req.body[key] };
        }
      }
    });

    await config.save();

    return res.status(200).json({
      success: true,
      message: 'App configuration updated successfully.',
      data: config
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Failed to update app configuration.',
      error: error.message
    });
  }
});

module.exports = router;