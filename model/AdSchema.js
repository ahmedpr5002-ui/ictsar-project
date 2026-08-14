const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "عنوان الإعلان مطلوب"],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    image: {
      type: String,
      required: [true, "رابط/مسار صورة الإعلان مطلوب"],
    },
    badge: {
      type: String,
      trim: true,
      default: "",
    },
    link: {
      type: String,
      default: "#",
    },
    isActive: {
      type: Boolean,
      default: true, // للتحكم بنشر أو إخفاء الإعلان
    },
    order: {
      type: Number,
      default: 0, // للتحكم بترتيب عرض الإعلانات
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ad", adSchema);