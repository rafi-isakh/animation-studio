import type {MetadataRoute} from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        "name": "Toonyz",
        "theme_color": "#000000",
        "background_color": "#000000",
        "short_name": "Toonyz",
        "id": "toonyz_app",
        "description": "Toonyz is the Global Story Platform where you can read novels and create videos of your favorite stories.",
        "icons": [
        {
            "src": "/icons/stellyFace192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "/icons/stellyFace256.png",
            "sizes": "256x256",
            "type": "image/png"
        },
        {
            "src": "/icons/512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ],
    "start_url": "/",
    "display": "standalone",
    "orientation": "portrait"
    }
}