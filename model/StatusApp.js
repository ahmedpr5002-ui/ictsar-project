const mongoose = require('mongoose');

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
  {
    timestamps: true
  }
);

appConfigSchema.statics.getSingletonInstance = async function () {
  let config = await this.findOne({ key: 'global_app_config' });
  if (!config) {
    config = await this.create({ key: 'global_app_config' });
  }
  return config;
};

const AppConfig = mongoose.model('AppConfig', appConfigSchema);
module.exports = AppConfig;