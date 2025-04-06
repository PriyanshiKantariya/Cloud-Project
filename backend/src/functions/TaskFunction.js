const { app } = require('@azure/functions');
const { getContainer } = require('../../config/db');

app.http('TaskFunction', {
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    authLevel: 'anonymous',
    route: 'tasks/{id?}',
    handler: async (request, context) => {
        // Add CORS headers to all responses
        const headers = {
            "Access-Control-Allow-Origin": "http://localhost:3000",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        };
        
        // Handle preflight OPTIONS request
        if (request.method === 'OPTIONS') {
            return { headers, status: 204 };
        }
        
        try {
            const container = await getContainer();
            const id = request.params?.id;
            
            // GET all tasks
            if (request.method === 'GET' && !id) {
                const { resources } = await container.items.readAll().fetchAll();
                return { headers, jsonBody: resources };
            }
            
            // GET a specific task
            if (request.method === 'GET' && id) {
                try {
                    const { resource } = await container.item(id, id).read();
                    if (!resource) {
                        return { headers, status: 404, jsonBody: { message: "Task not found" } };
                    }
                    return { headers, jsonBody: resource };
                } catch (error) {
                    return { headers, status: 404, jsonBody: { message: "Task not found" } };
                }
            }
            
            // CREATE a new task
            if (request.method === 'POST') {
                const task = await request.json();
                
                // Generate a unique ID if not provided
                if (!task.id) {
                    task.id = generateId();
                }
                
                // Set timestamps
                const now = new Date().toISOString();
                task.createdAt = now;
                task.updatedAt = now;
                
                const { resource: createdTask } = await container.items.create(task);
                return { headers, status: 201, jsonBody: createdTask };
            }
            
            // UPDATE a task
            if (request.method === 'PUT' && id) {
                const task = await request.json();
                task.id = id; // Ensure ID is set correctly
                task.updatedAt = new Date().toISOString();
                
                // Check if task exists
                try {
                    await container.item(id, id).read();
                } catch (error) {
                    return { headers, status: 404, jsonBody: { message: "Task not found" } };
                }
                
                const { resource: updatedTask } = await container.item(id, id).replace(task);
                return { headers, jsonBody: updatedTask };
            }
            
            // DELETE a task
            if (request.method === 'DELETE' && id) {
                await container.item(id, id).delete();
                return { headers, status: 204 };
            }
            
            return { headers, status: 400, jsonBody: { message: "Invalid request" } };
            
        } catch (error) {
            context.error("Error processing request:", error);
            return {
                headers,
                status: 500,
                jsonBody: { message: "An error occurred while processing your request." }
            };
        }
    }
});

function generateId() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 15);
}
