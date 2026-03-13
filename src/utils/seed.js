import "dotenv/config";
import mongoose from "mongoose";
import userSchema from "../models/User.model.js";
import courseSchema from "../models/Course.model.js";
import Video from "../models/Video.model.js"

const SEED_COURSES = [
  {
    title: "Foundations of Natural Spices",
    shortDesc:
      "Master the origins, botany, and cultural significance of the world's most prized spices.",
    description:
      "A comprehensive introduction to the world of natural spices. Students will explore botanical classification, geographic origins, historical trade routes, and the cultural significance of spices across African and Asian civilisations. This course forms the foundation for all advanced SpiceAcademy training.",
    price: 49,
    level: "Beginner",
    tags: ["Botany", "History", "Culture"],
    category: "Botany",
    totalLessons: 12,
    isPublished: true,
    isFeatured: true,
    thumbnail:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80",
  },
  {
    title: "Medicinal Properties & Health Benefits",
    shortDesc:
      "Explore the powerful healing compounds found in turmeric, ginger, cloves, and more.",
    description:
      "An in-depth look at the phytochemistry of medicinal spices. Topics include curcumin bioavailability, gingerol anti-inflammatory action, eugenol antimicrobial properties, and evidence-based clinical applications. Ideal for healthcare professionals and wellness coaches.",
    price: 79,
    level: "Intermediate",
    tags: ["Health", "Nutrition", "Phytochemistry"],
    category: "Health",
    totalLessons: 16,
    isPublished: true,
    isFeatured: true,
    thumbnail:
      "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80",
  },
  {
    title: "Spice Blending Mastery",
    shortDesc:
      "Create complex, balanced spice blends for culinary excellence and aromatic perfection.",
    description:
      "Learn the art and science of spice blending from a Michelin-trained chef. Students develop proficiency in flavour pairing, aromatic balance, regional blend traditions (ras el hanout, berbere, masala), and commercial blend formulation.",
    price: 99,
    level: "Advanced",
    tags: ["Culinary", "Blending", "Aroma"],
    category: "Culinary",
    totalLessons: 20,
    isPublished: true,
    isFeatured: true,
    thumbnail:
      "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=600&q=80",
  },
  {
    title: "Sustainable Spice Farming",
    shortDesc:
      "Learn organic cultivation, harvesting and post-harvest processing of premium spices.",
    description:
      "Practical training for farmers and agribusiness professionals. Topics include soil preparation, seed selection, organic pest management, harvesting techniques, post-harvest drying and grading, and smallholder value chain integration.",
    price: 59,
    level: "Beginner",
    tags: ["Farming", "Sustainability", "Organic"],
    category: "Farming",
    totalLessons: 11,
    isPublished: true,
    isFeatured: false,
    thumbnail:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80",
  },
  {
    title: "Spice Trade & Entrepreneurship",
    shortDesc:
      "Build a profitable spice business from sourcing to e-commerce and global distribution.",
    description:
      "An MBA-style course on building a spice business. Covers sourcing networks, quality grading, branding, packaging regulations, e-commerce platforms, export documentation, and building retail and B2B distribution channels.",
    price: 89,
    level: "Intermediate",
    tags: ["Business", "Trade", "Marketing"],
    category: "Business",
    totalLessons: 14,
    isPublished: true,
    isFeatured: false,
    thumbnail:
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80",
  },
  {
    title: "Aromatherapy & Essential Oils",
    shortDesc:
      "Extract and harness the therapeutic power of spice-derived essential oils.",
    description:
      "A practitioner's guide to extracting and applying essential oils derived from spices. Covers steam distillation, cold pressing, blending for therapeutic outcomes, safety protocols, and building an aromatherapy practice.",
    price: 95,
    level: "Advanced",
    tags: ["Aromatherapy", "Wellness", "Oils"],
    category: "Aromatherapy",
    totalLessons: 15,
    isPublished: true,
    isFeatured: false,
    thumbnail:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&q=80",
  },
];

const VIDEO_TEMPLATES = [
  {
    title: 'Introduction & Overview',
    description: 'Welcome lesson — an overview of what you will learn in this course.',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=400&q=80',
    duration: 60, order: 1, isFree: true,
  },
  {
    title: 'Core Concepts Deep Dive',
    description: 'We explore the foundational concepts in detail with practical examples.',
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80',
    duration: 120, order: 2, isFree: false,
  },
  {
    title: 'Practical Application & Summary',
    description: 'Hands-on application of what we have learned, plus a course summary.',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&q=80',
    duration: 90, order: 3, isFree: false,
  },
];

async function seed() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/spiceacademy",
    );
    console.log("✅  Connected to MongoDB");

    // Clear existing data
    await Promise.all([userSchema.deleteMany(), courseSchema.deleteMany()]);
    console.log("🗑️   Cleared existing data");

    // Create admin user
    const admin = await userSchema.create({
      name: "Admin SpiceAcademy",
      email: "admin@spiceacademy.com",
      password: "Admin@1234",
      role: "admin",
      isVerified: true,
      plan: "enterprise",
    });
    console.log("👤  Admin created: admin@spiceacademy.com / Admin@1234");

    // Create instructor
    const instructor = await userSchema.create({
      name: "Dr. Amara Osei",
      email: "instructor@spiceacademy.com",
      password: "Instructor@1234",
      role: "instructor",
      isVerified: true,
      bio: "20 years researching medicinal plants across West Africa.",
    });
    console.log(
      "👤  Instructor created: instructor@spiceacademy.com / Instructor@1234",
    );

    // Create demo student
    await userSchema.create({
      name: "Demo Student",
      email: "student@spiceacademy.com",
      password: "Student@1234",
      role: "student",
      isVerified: true,
    });
    console.log("👤  Student created: student@spiceacademy.com / Student@1234");

    const courses = [];
    for (const c of SEED_COURSES) {
      const course = await courseSchema.create({
        ...c,
        instructor: instructor._id,
        instructorName: instructor.name,
      });
      courses.push(course);
    }
    console.log(`📚  ${courses.length} courses seeded`);

    console.log("\n🌿  Seed complete! SpiceAcademy database is ready.\n");
    // ─── Seed 3 videos per course ─────────────────────────────────────────
    let videoCount = 0;
    for (const course of courses) {
      for (const v of VIDEO_TEMPLATES) {
        await Video.create({
          title: `${v.title} — ${course.title}`,
          description: v.description,
          course: course._id,
          uploadedBy: instructor._id,
          filename: `seed-video-${course._id}-${v.order}.mp4`,
          originalName: `${v.title}.mp4`,
          filePath: v.videoUrl,
          fileSize: 0,
          mimeType: "video/mp4",
          duration: v.duration,
          thumbnail: v.thumbnail,
          order: v.order,
          isFree: v.isFree,
          isPublished: true,
        });
        videoCount++;
      }
    }
    console.log(
      `🎬  ${videoCount} videos seeded (${VIDEO_TEMPLATES.length} per course)`,
    );

    console.log("\n🌿  Seed complete! SpiceAcademy database is ready.\n");
    process.exit(0);
  } catch (err) {
    console.error("❌  Seed error:", err);
    process.exit(1);
  }
}

seed();







