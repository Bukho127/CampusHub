import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDatabase } from "../config/db";
import { Category } from "../models/Category";
import { CommunityPost } from "../models/CommunityPost";
import { Listing } from "../models/Listing";
import { User } from "../models/User";

async function upsertUser(input: {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  identityType: "student" | "faculty" | "resident" | "vendor";
  role?: "user" | "vendor" | "admin";
  emailVerificationStatus?: "unverified" | "pending" | "verified";
  vendorVerificationStatus?: "unverified" | "pending" | "verified";
  rating?: number;
  reviewCount?: number;
  location: string;
}) {
  const passwordHash = await bcrypt.hash("Password123!", 12);
  return User.findOneAndUpdate(
    { email: input.email },
    {
      ...input,
      passwordHash,
      role: input.role ?? "user",
      emailVerificationStatus: input.emailVerificationStatus ?? "verified",
      vendorVerificationStatus: input.vendorVerificationStatus ?? "unverified"
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function seed() {
  await connectDatabase();

  const categories = [
    ["stationery", "Stationery"],
    ["textbooks", "Textbooks"],
    ["electronics", "Electronics"],
    ["furniture", "Furniture"],
    ["services", "Services"],
    ["food", "Food & Bev"]
  ];

  await Promise.all(
    categories.map(([slug, name]) =>
      Category.findOneAndUpdate({ slug }, { slug, name }, { upsert: true, new: true, setDefaultsOnInsert: true })
    )
  );

  const abdul = await upsertUser({
    firstName: "Abdul",
    lastName: "Moosa",
    displayName: "Abdul's Shop",
    email: "abdul.shop@example.com",
    identityType: "student",
    rating: 4.8,
    reviewCount: 24,
    location: "District Six Campus"
  });

  const mama = await upsertUser({
    firstName: "Nandi",
    lastName: "Mokoena",
    displayName: "Mama Afrika",
    email: "mama.afrika@example.com",
    identityType: "vendor",
    role: "vendor",
    vendorVerificationStatus: "verified",
    rating: 4.6,
    reviewCount: 18,
    location: "Cape Town"
  });

  const naledi = await upsertUser({
    firstName: "Naledi",
    lastName: "M.",
    displayName: "Naledi M.",
    email: "naledi@example.com",
    identityType: "student",
    rating: 4.9,
    reviewCount: 11,
    location: "Paarl"
  });

  await upsertUser({
    firstName: "Admin",
    lastName: "User",
    displayName: "Community Store Admin",
    email: "admin@example.com",
    identityType: "faculty",
    role: "admin",
    emailVerificationStatus: "verified",
    location: "District Six Campus"
  });

  const listings = [
    {
      type: "goods",
      title: "2 Quire Notebook",
      description: "A clean 152-page notebook for lecture notes, lab planning, or revision.",
      category: "stationery",
      priceCents: 3599,
      condition: "New",
      quantityAvailable: 8,
      location: "District Six Campus",
      seller: abdul._id,
      sellerType: "casual",
      rating: 4.7,
      reviewCount: 2,
      negotiable: false,
      tradeEnabled: false,
      images: [{ url: "/uploads/notebook.png", filename: "notebook.png", mimetype: "image/png", size: 0, alt: "Notebook photo slot" }]
    },
    {
      type: "goods",
      title: "Isijokojoko",
      description: "Fresh campus lunch bowl with roasted vegetables and a spicy sauce.",
      category: "food",
      priceCents: 8599,
      condition: "New",
      quantityAvailable: 6,
      location: "Cape Town",
      seller: mama._id,
      sellerType: "vendor",
      rating: 4.5,
      reviewCount: 7,
      negotiable: false,
      tradeEnabled: false,
      images: [{ url: "/uploads/isijokojoko.png", filename: "isijokojoko.png", mimetype: "image/png", size: 0, alt: "Food photo slot" }]
    },
    {
      type: "goods",
      title: "Scientific Calculator",
      description: "Good condition calculator for maths, accounting, and engineering modules.",
      category: "electronics",
      priceCents: 35000,
      condition: "Good",
      quantityAvailable: 1,
      location: "District Six Campus",
      seller: naledi._id,
      sellerType: "casual",
      rating: 4.9,
      reviewCount: 5,
      negotiable: true,
      tradeEnabled: true,
      images: [{ url: "/uploads/calculator.png", filename: "calculator.png", mimetype: "image/png", size: 0, alt: "Calculator photo slot" }]
    },
    {
      type: "goods",
      title: "Java Textbook",
      description: "Introductory Java programming textbook with light highlighting.",
      category: "textbooks",
      priceCents: 45000,
      condition: "Like New",
      quantityAvailable: 1,
      location: "Paarl",
      seller: naledi._id,
      sellerType: "casual",
      rating: 4.9,
      reviewCount: 3,
      negotiable: true,
      tradeEnabled: false,
      images: [{ url: "/uploads/java-textbook.png", filename: "java-textbook.png", mimetype: "image/png", size: 0, alt: "Textbook photo slot" }]
    },
    {
      type: "goods",
      title: "iPhone 12",
      description: "Unlocked iPhone 12, 64GB, with cable and a clear case.",
      category: "electronics",
      priceCents: 650000,
      condition: "Good",
      quantityAvailable: 1,
      location: "Cape Town",
      seller: abdul._id,
      sellerType: "casual",
      rating: 4.8,
      reviewCount: 8,
      negotiable: true,
      tradeEnabled: false,
      images: [{ url: "/uploads/iphone-12.png", filename: "iphone-12.png", mimetype: "image/png", size: 0, alt: "Phone photo slot" }]
    },
    {
      type: "goods",
      title: "Desk and Chair",
      description: "Compact study desk and chair set for a student room.",
      category: "furniture",
      priceCents: 90000,
      condition: "Fair",
      quantityAvailable: 1,
      location: "District Six Campus",
      seller: abdul._id,
      sellerType: "casual",
      reviewCount: 0,
      negotiable: true,
      tradeEnabled: true,
      images: [{ url: "/uploads/desk-chair.png", filename: "desk-chair.png", mimetype: "image/png", size: 0, alt: "Furniture photo slot" }]
    },
    {
      type: "service",
      title: "Student Photography Session",
      description: "Affordable portrait or event photo session for campus groups and societies.",
      category: "services",
      priceCents: 30000,
      serviceMode: "enquiry",
      location: "Cape Town",
      seller: naledi._id,
      sellerType: "casual",
      rating: 5,
      reviewCount: 6,
      negotiable: false,
      tradeEnabled: false,
      images: [{ url: "/uploads/photography.png", filename: "photography.png", mimetype: "image/png", size: 0, alt: "Photography photo slot" }]
    }
  ];

  for (const listing of listings) {
    await Listing.findOneAndUpdate(
      { title: listing.title },
      { ...listing, currency: "ZAR", status: "active" },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );
  }

  const posts = [
    {
      title: "Student Market Friday",
      summary: "Bring second-hand books, clothing, and dorm essentials to the central courtyard.",
      body: "Community Store is coordinating a student market for affordable second-hand trading and sustainability on campus.",
      type: "event",
      dateLabel: "Friday",
      author: naledi._id
    },
    {
      title: "Textbook Exchange",
      summary: "The library society is collecting course books for affordable resale.",
      body: "Drop off textbooks in good condition and help another student save money this term.",
      type: "announcement",
      dateLabel: "This week",
      author: abdul._id
    }
  ];

  for (const post of posts) {
    await CommunityPost.findOneAndUpdate({ title: post.title }, post, { upsert: true, new: true, setDefaultsOnInsert: true });
  }

  console.log("Seed complete");
  console.log("Demo password for seeded users: Password123!");
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
