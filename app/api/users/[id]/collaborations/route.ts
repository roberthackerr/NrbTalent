// app/api/users/[id]/collaborations/route.ts
import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = await getDatabase()
    const userId = new ObjectId(id)

    // Récupérer tous les contrats de l'utilisateur
    const contracts = await db.collection("contracts").aggregate([
      {
        $match: {
          $or: [
            { clientId: userId },
            { freelancerId: userId }
          ],
          status: { $in: ["completed", "signed"] }
        }
      },
      {
        $lookup: {
          from: "users",
          let: { otherId: { $cond: [
            { $eq: ["$clientId", userId] },
            "$freelancerId",
            "$clientId"
          ]}},
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$otherId"] } } },
            { $project: { 
              _id: 1,
              name: 1,
              avatar: 1,
              title: 1,
              role: 1,
              rating: 1
            }}
          ],
          as: "otherUser"
        }
      },
      { $unwind: "$otherUser" },
      {
        $lookup: {
          from: "reviews",
          let: { contractId: "$_id" },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ["$contractId", "$$contractId"] },
                    { $eq: ["$reviewedId", userId] }
                  ]
                }
              }
            }
          ],
          as: "receivedReview"
        }
      },
      {
        $lookup: {
          from: "reviews",
          let: { contractId: "$_id" },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ["$contractId", "$$contractId"] },
                    { $eq: ["$reviewerId", userId] }
                  ]
                }
              }
            }
          ],
          as: "givenReview"
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          type: 1,
          amount: 1,
          currency: 1,
          startDate: 1,
          endDate: 1,
          status: 1,
          canReview: {
            $and: [
              { $eq: ["$status", "completed"] },
              { $lt: [
                { $divide: [
                  { $subtract: [new Date(), "$endDate"] },
                  1000 * 60 * 60 * 24
                ]},
                30
              ]},
              { $eq: [{ $size: "$givenReview" }, 0] }
            ]
          },
          daysSinceCompletion: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), "$endDate"] },
                1000 * 60 * 60 * 24
              ]
            }
          },
          otherUser: 1,
          hasReceivedReview: { $gt: [{ $size: "$receivedReview" }, 0] },
          hasGivenReview: { $gt: [{ $size: "$givenReview" }, 0] }
        }
      },
      { $sort: { endDate: -1 } }
    ]).toArray()

    return NextResponse.json({ collaborations: contracts })
  } catch (error) {
    console.error("Erreur récupération collaborations:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}