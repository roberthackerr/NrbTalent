
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDatabase()

    // Fetch all categories directly from the "categories" collection
    const categories = await db
      .collection("categories")
      .find({})
      .sort({ count: -1 }) // Sort by popularity
      .toArray()
       const popularSkills = await db
      .collection("popular_skills")
      .find({})
      .sort({ count: -1 }) // Sort by popularity
      .toArray()

    // Optional: limit if needed
    // .limit(60)

    return NextResponse.json({
      categories,popularSkills,
      meta: {
        totalCategories: categories.length,
        totalpopularSkills: popularSkills.length,
      },
    })
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des catégories:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}


// import { NextResponse } from "next/server"
// import { getDatabase } from "@/lib/mongodb"

// export async function GET() {
//   try {
//     const db = await getDatabase()
    
//     // Récupérer les catégories et sous-catégories les plus populaires
//     const categories = await db.collection("projects").aggregate([
//       {
//         $group: {
//           _id: "$category",
//           count: { $sum: 1 },
//           subcategories: { $addToSet: "$subcategory" }
//         }
//       },
//       { $sort: { count: -1 } },
//       {
//         $project: {
//           name: "$_id",
//           count: 1,
//           subcategories: {
//             $filter: {
//               input: "$subcategories",
//               as: "subcat",
//               cond: { $ne: ["$$subcat", null] }
//             }
//           }
//         }
//       }
//     ]).toArray()

//     // Compétences les plus demandées
//     const popularSkills = await db.collection("projects").aggregate([
//       { $unwind: "$skills" },
//       {
//         $group: {
//           _id: "$skills",
//           count: { $sum: 1 },
//           avgBudget: { $avg: "$budget.max" }
//         }
//       },
//       { $sort: { count: -1 } },
//       { $limit: 20 },
//       {
//         $project: {
//           skill: "$_id",
//           count: 1,
//           avgBudget: { $round: ["$avgBudget", 2] }
//         }
//       }
//     ]).toArray()

//     return NextResponse.json({
//       categories,
//       popularSkills,
//       meta: {
//         totalCategories: categories.length,
//         totalSkills: popularSkills.length
//       }
//     })
//   } catch (error) {
//     console.error("Erreur lors de la récupération des catégories:", error)
//     return NextResponse.json(
//       { error: "Erreur interne du serveur" },
//       { status: 500 }
//     )
//   }
// }