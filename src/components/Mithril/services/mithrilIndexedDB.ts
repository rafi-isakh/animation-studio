// Mithril IndexedDB Service
// Stores large image data that exceeds localStorage limits

const DB_NAME = "MithrilDB";
const STORE_NAME = "mithrilAssets";
const DB_VERSION = 1;

export interface MithrilImage {
  id: string; // e.g., "bg_{bgId}_{angle}" like "bg_abc123_Front_View"
  type: "bg_image";
  base64: string;
  mimeType: string;
  bgId: string; // Reference to parent background
  angle: string; // "Front View", "Side View (Left)", etc.
  createdAt: number;
}

export interface NanoBananaImage {
  id: string; // e.g., "nano_banana_{resultId}"
  type: "nano_banana_image";
  base64: string;
  mimeType: string;
  resultId: string; // Reference to parent result
  createdAt: number;
}

export interface CharacterImage {
  id: string; // e.g., "char_{characterId}"
  type: "character_image";
  base64: string;
  mimeType: string;
  characterId: string; // Reference to parent character
  createdAt: number;
}

export interface StoryboardSceneImage {
  id: string; // e.g., "scene_1.1" or "scene_2.5"
  type: "storyboard_scene_image";
  base64: string;
  mimeType: string;
  sceneIndex: number;
  clipIndex: number;
  clipName: string; // e.g., "1.1", "2.3"
  imagePrompt: string; // The prompt used to generate
  selectedBgId: string; // Reference to background used
  createdAt: number;
}

export type StoredItem = MithrilImage | NanoBananaImage | CharacterImage | StoryboardSceneImage;

let db: IDBDatabase | null = null;

const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("MithrilDB error:", request.error);
      reject("Error opening MithrilDB.");
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;

      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        const store = dbInstance.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });
        // Create index for querying by bgId
        store.createIndex("bgId", "bgId", { unique: false });
      }
    };
  });
};

// Save a single background image
export const saveBgImage = async (image: MithrilImage): Promise<void> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.put(image);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error("Error saving image in MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// Get a single background image by ID
export const getBgImage = async (id: string): Promise<MithrilImage | null> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => {
      console.error("Error getting image from MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// Get all images for a specific background ID
export const getBgImagesByBgId = async (
  bgId: string
): Promise<MithrilImage[]> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index("bgId");

  return new Promise((resolve, reject) => {
    const request = index.getAll(bgId);
    request.onsuccess = () => {
      resolve(request.result as MithrilImage[]);
    };
    request.onerror = () => {
      console.error("Error getting images by bgId from MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// Delete all images for a specific background ID
export const deleteBgImagesByBgId = async (bgId: string): Promise<void> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);
  const index = store.index("bgId");

  return new Promise((resolve, reject) => {
    const getRequest = index.getAllKeys(bgId);

    getRequest.onsuccess = () => {
      const keys = getRequest.result;
      keys.forEach((key) => {
        store.delete(key);
      });
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      console.error("Error deleting images from MithrilDB:", transaction.error);
      reject(transaction.error);
    };
  });
};

// Get all background images
export const getAllBgImages = async (): Promise<MithrilImage[]> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result as StoredItem[];
      // Filter to only bg_image types
      resolve(items.filter((item) => item.type === "bg_image") as MithrilImage[]);
    };
    request.onerror = () => {
      console.error("Error getting all images from MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// Clear all data (useful for testing/reset)
export const clearAllData = async (): Promise<void> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error("Error clearing MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// Clear only background images (preserves NanoBanana images)
export const clearBgImagesOnly = async (): Promise<void> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        if (cursor.value.type === "bg_image") {
          cursor.delete();
        }
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      console.error("Error clearing bg images from MithrilDB:", transaction.error);
      reject(transaction.error);
    };
  });
};

// ============ NanoBanana Image Functions ============

// Save a NanoBanana generated image
export const saveNanoBananaImage = async (
  image: NanoBananaImage
): Promise<void> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.put(image);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error("Error saving NanoBanana image in MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// Get a NanoBanana image by ID
export const getNanoBananaImage = async (
  id: string
): Promise<NanoBananaImage | null> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const result = request.result;
      if (result && result.type === "nano_banana_image") {
        resolve(result as NanoBananaImage);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => {
      console.error("Error getting NanoBanana image from MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// Get all NanoBanana images
export const getAllNanoBananaImages = async (): Promise<NanoBananaImage[]> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result as StoredItem[];
      resolve(
        items.filter(
          (item) => item.type === "nano_banana_image"
        ) as NanoBananaImage[]
      );
    };
    request.onerror = () => {
      console.error(
        "Error getting all NanoBanana images from MithrilDB:",
        request.error
      );
      reject(request.error);
    };
  });
};

// Delete a NanoBanana image by ID
export const deleteNanoBananaImage = async (id: string): Promise<void> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error("Error deleting NanoBanana image from MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// Get NanoBanana image by scene and clip index
// Note: sceneIndex and clipIndex are 0-indexed, but keys are stored as 1-indexed (e.g., "scene_1.1")
export const getNanoBananaImageBySceneClip = async (
  sceneIndex: number,
  clipIndex: number
): Promise<string | null> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);
  const id = `scene_${sceneIndex + 1}.${clipIndex + 1}`;

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const result = request.result;
      // Return base64 string if found, null otherwise
      resolve(result?.base64 || null);
    };
    request.onerror = () => {
      console.error("Error getting NanoBanana image by scene/clip from MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// ============ Character Image Functions ============

// Save a Character sheet image
export const saveCharacterImage = async (
  image: CharacterImage
): Promise<void> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.put(image);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error("Error saving Character image in MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// Get a Character image by ID
export const getCharacterImage = async (
  id: string
): Promise<CharacterImage | null> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const result = request.result;
      if (result && result.type === "character_image") {
        resolve(result as CharacterImage);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => {
      console.error("Error getting Character image from MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// Get all Character images
export const getAllCharacterImages = async (): Promise<CharacterImage[]> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result as StoredItem[];
      resolve(
        items.filter(
          (item) => item.type === "character_image"
        ) as CharacterImage[]
      );
    };
    request.onerror = () => {
      console.error(
        "Error getting all Character images from MithrilDB:",
        request.error
      );
      reject(request.error);
    };
  });
};

// Delete a Character image by ID
export const deleteCharacterImage = async (id: string): Promise<void> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error("Error deleting Character image from MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// Clear only character images (preserves BG and NanoBanana images)
export const clearCharacterImagesOnly = async (): Promise<void> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        if (cursor.value.type === "character_image") {
          cursor.delete();
        }
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      console.error("Error clearing character images from MithrilDB:", transaction.error);
      reject(transaction.error);
    };
  });
};

// ============ Storyboard Scene Image Functions ============

// Save a storyboard scene image
export const saveStoryboardSceneImage = async (
  image: StoryboardSceneImage
): Promise<void> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.put(image);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      console.error("Error saving storyboard scene image in MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// Get a storyboard scene image by ID
export const getStoryboardSceneImage = async (
  id: string
): Promise<StoryboardSceneImage | null> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const result = request.result;
      if (result && result.type === "storyboard_scene_image") {
        resolve(result as StoryboardSceneImage);
      } else {
        resolve(null);
      }
    };
    request.onerror = () => {
      console.error("Error getting storyboard scene image from MithrilDB:", request.error);
      reject(request.error);
    };
  });
};

// Get all storyboard scene images
export const getAllStoryboardSceneImages = async (): Promise<StoryboardSceneImage[]> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readonly");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result as StoredItem[];
      resolve(
        items.filter(
          (item) => item.type === "storyboard_scene_image"
        ) as StoryboardSceneImage[]
      );
    };
    request.onerror = () => {
      console.error(
        "Error getting all storyboard scene images from MithrilDB:",
        request.error
      );
      reject(request.error);
    };
  });
};

// Clear only storyboard scene images
export const clearStoryboardSceneImagesOnly = async (): Promise<void> => {
  const database = await getDB();
  const transaction = database.transaction([STORE_NAME], "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        if (cursor.value.type === "storyboard_scene_image") {
          cursor.delete();
        }
        cursor.continue();
      }
    };

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      console.error("Error clearing storyboard scene images from MithrilDB:", transaction.error);
      reject(transaction.error);
    };
  });
};
