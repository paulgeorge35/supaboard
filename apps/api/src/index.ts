import { createApp } from './app';

const PORT = process.env.PORT || 8000;

async function startServer(): Promise<void> {
    try {
        const app = await createApp();
        
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
