class DBHelper {

    static async connectDB(client) {
        try {
            await client.connect();
            const db = client.db("CRMAccount");

            const userCollection = db.collection("users");

            // Ensure unique username
            await userCollection.createIndex(
                { UserName: 1 },
                { unique: true }
            );

            console.log("Connected to MongoDB: CRMAccount");

            return userCollection;
        } catch (err) {
            console.error("DB connection failed:", err);
            return null;
        }
    }

    static async insertToCollection(collection, data) {
        try {
            await collection.insertOne(data);
            console.log("Insert success");
            return true;
        } catch (err) {
            console.error("Insert failed:", err);
            return false;
        }
    }

    static async findInCollection(collection, query) {
        try {
            return await collection.findOne(query);
        } catch (err) {
            console.error("Query failed:", err);
            return null;
        }
    }

    static async updateCollection(
        collection,
        filter,
        updateData,
        upsert = false
    ) {
        try {
            const result = await collection.updateOne(
                filter,
                { $set: updateData },
                { upsert }
            );

            console.log("Update success:", result.modifiedCount);
            return result;
        } catch (err) {
            console.error("Update failed:", err);
            return null;
        }
    }

    static async getNextRowId(collection) {
        try {
            const lastRecord = await collection
                .find({}, { projection: { row_id: 1 } })
                .sort({ row_id: -1 })
                .limit(1)
                .toArray();

            return lastRecord.length === 0
                ? 1
                : lastRecord[0].row_id + 1;
        } catch (error) {
            console.error("Error generating next row_id:", error);
            throw error;
        }
    }

    static isAuthenticated(request) {
        return !!request.session?.user;
    }

    static getTrendTag(growth, positiveThreshold = 10, negativeThreshold = -10) {
        if (growth === null || isNaN(growth)) return "No Data";
        if (growth >= positiveThreshold) return "Rising";
        if (growth <= negativeThreshold) return "Falling";
        return "Stable";
    }

    static async sales_analysis(user_database, months = 1) {
        const sales_collection = await user_database.collection('SalesOrders');

        // Step 1: Monthly aggregation
        const monthlyData = await sales_collection.aggregate([
            {
                $addFields: {
                    orderDateObj: { $toDate: "$OrderDate" },
                    yearMonth: {
                        $dateToString: {
                            format: "%Y-%m",
                            date: { $toDate: "$OrderDate" }
                        }
                    }
                }
            },
            {
                $group: {
                    _id: {
                        productId: "$ProductId",
                        month: "$yearMonth"
                    },
                    units_sold: { $sum: "$Quantity" },
                    product_revenue: { $sum: "$TotalAmount" }
                }
            },
            {
                $sort: {
                    "_id.productId": 1,
                    "_id.month": 1
                }
            }
        ]).toArray();

        // Step 2: Group by product
        const productMap = {};
        for (const row of monthlyData) {
            const pid = row._id.productId;
            if (!productMap[pid]) productMap[pid] = [];
            productMap[pid].push(row);
        }

        // Step 3: Period-over-period comparison
        const result = [];

        for (const pid in productMap) {
            const history = productMap[pid];

            // Need at least 2 * N months
            if (history.length < months * 2) continue;

            const currentPeriod = history.slice(-months);
            const previousPeriod = history.slice(-months * 2, -months);

            const currentRevenue = currentPeriod.reduce(
                (sum, m) => sum + m.product_revenue, 0
            );
            const previousRevenue = previousPeriod.reduce(
                (sum, m) => sum + m.product_revenue, 0
            );

            const currentUnits = currentPeriod.reduce(
                (sum, m) => sum + m.units_sold, 0
            );
            const previousUnits = previousPeriod.reduce(
                (sum, m) => sum + m.units_sold, 0
            );

            const revenueGrowth =
                previousRevenue > 0
                    ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
                    : null;

            const unitsGrowth =
                previousUnits > 0
                    ? ((currentUnits - previousUnits) / previousUnits) * 100
                    : null;

            result.push({
                productId: pid,
                period_months: months,
                current_period: {
                    from: currentPeriod[0]._id.month,
                    to: currentPeriod[currentPeriod.length - 1]._id.month,
                    revenue: currentRevenue,
                    units: currentUnits
                },
                previous_period: {
                    from: previousPeriod[0]._id.month,
                    to: previousPeriod[previousPeriod.length - 1]._id.month,
                    revenue: previousRevenue,
                    units: previousUnits
                },
                revenue_trend: this.getTrendTag(revenueGrowth),
                units_trend: this.getTrendTag(unitsGrowth),
                revenue_growth: revenueGrowth !== null ? revenueGrowth.toFixed(2) : null,
                units_growth: unitsGrowth !== null ? unitsGrowth.toFixed(2) : null
            });
        }

        return result;
    }

}

module.exports = DBHelper;
