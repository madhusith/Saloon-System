import { pool } from '../config/database.js';

export const inventoryRepository = {
    /**
     * Log a stock movement entry in the database
     */
    async logMovement(movementData, connection = null) {
        const db = connection || pool;
        const {
            productId,
            movementType,
            quantity,
            stockBefore,
            stockAfter,
            referenceType,
            referenceId,
            note,
            createdBy
        } = movementData;

        await db.execute(
            `INSERT INTO stock_movements (
        product_id, movement_type, quantity, stock_before, stock_after, 
        reference_type, reference_id, note, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                productId,
                movementType,
                quantity,
                stockBefore,
                stockAfter,
                referenceType || 'MANUAL',
                referenceId || null,
                note || null,
                createdBy
            ]
        );
    },

    /**
     * List stock movements history logs with pagination and filters
     */
    async listMovements({ productId, movementType, limit = 10, offset = 0 } = {}) {
        let query = `
      SELECT sm.*, 
             p.name AS product_name, p.sku AS product_sku, 
             u.full_name AS creator_name
      FROM stock_movements sm
      INNER JOIN products p ON sm.product_id = p.id
      INNER JOIN users u ON sm.created_by = u.id
      WHERE 1=1
    `;
        const params = [];

        if (productId) {
            query += ' AND sm.product_id = ?';
            params.push(Number(productId));
        }

        if (movementType) {
            query += ' AND sm.movement_type = ?';
            params.push(movementType);
        }

        // Get total count
        const countQuery = `SELECT COUNT(*) as count FROM (${query}) as t`;
        const [countRows] = await pool.query(countQuery, params);
        const total = countRows[0].count;

        // Add pagination
        query += ' ORDER BY sm.created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));

        const [movements] = await pool.query(query, params);
        return { movements, total };
    }
};
