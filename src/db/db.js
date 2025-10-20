// appIndexedDB.js
import { getFirstLevelGrid, LEVEL_1_WIDTH, LEVEL_1_HEIGHT } from './level1';

const DB_NAME = 'YandexRobotDB';
const DB_VERSION = 1;

let dbPromise = null;

async function initializeIfEmpty(db) {
  try {
    // Проверяем, есть ли уже данные в таблице levels
    const levelsStore = db.transaction('levels', 'readonly').objectStore('levels');
    const levelsCount = await new Promise((resolve, reject) => {
      const req = levelsStore.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    // Если данных нет, инициализируем
    if (levelsCount === 0) {
      const tx = db.transaction(['levels', 'users'], 'readwrite');
      const levelsTxStore = tx.objectStore('levels');
      const usersTxStore = tx.objectStore('users');

      const level1Grid = getFirstLevelGrid();
      levelsTxStore.add({
        levelId: 1,
        xmlAlgorithmConfig: '<xml></xml>',
        gridJson: level1Grid,
        width: LEVEL_1_WIDTH,
        height: LEVEL_1_HEIGHT,
      });

      usersTxStore.add({
        userId: 1,
        currentLevel: 1,
      });

      await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    // Открываем базу данных с фиксированной версией
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores
      const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
      usersStore.createIndex('currentLevel', 'currentLevel', { unique: false });
      usersStore.createIndex('userId', 'userId', { unique: false });

      const levelsStore = db.createObjectStore('levels', { keyPath: 'id', autoIncrement: true });
      levelsStore.createIndex('levelId', 'levelId', { unique: true });
      levelsStore.createIndex('width', 'width', { unique: false });
      levelsStore.createIndex('height', 'height', { unique: false });
    };

    req.onsuccess = async (event) => {
      const db = event.target.result;
      
      // Инициализируем данные только если база данных пустая
      await initializeIfEmpty(db);
      
      resolve(db);
    };

    req.onerror = (event) => {
      console.error('Ошибка открытия базы данных:', event.target.error);
      reject(event.target.error);
    };

    req.onblocked = () => {
      console.warn('DB open blocked. Close other connections to proceed.');
    };

    req.onversionchange = () => {
      console.log('Версия базы данных изменилась, закрываем соединение');
      dbPromise = null; // Сбрасываем кэш для переоткрытия
    };
  });

  return dbPromise;
}

function _txComplete(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    tx.onerror = () => reject(tx.error || new Error('Transaction error'));
  });
}

async function withStore(storeNames, mode, callback) {
  const db = await openDB();
  const tx = db.transaction(storeNames, mode);
  const stores = Array.isArray(storeNames)
    ? storeNames.map((name) => tx.objectStore(name))
    : tx.objectStore(storeNames);

  // callback may use store(s) and optionally return a value (or promise)
  const result = await callback(stores, tx);

  // wait for tx completion (or failure)
  await _txComplete(tx);
  return result;
}

/* API — аналог методов Dexie-класса */

// Вернуть первый пользовательский объект (или null)
export async function getUserState() {
  return await withStore('users', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const req = store.getAll(); // получаем все, затем берём первый
      req.onsuccess = () => {
        const arr = req.result;
        resolve(arr.length > 0 ? arr[0] : null);
      };
      req.onerror = () => reject(req.error);
    });
  });
}

// Сохранить состояние пользователя (если есть — обновить, иначе добавить)
export async function saveUserState(state) {
  return await withStore('users', 'readwrite', async (store) => {
    // Найдём существующего пользователя (первого)
    const existing = await new Promise((resolve, reject) => {
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => resolve(getAllReq.result[0] || null);
      getAllReq.onerror = () => reject(getAllReq.error);
    });

    const now = new Date();
    if (existing) {
      const updated = { ...existing, currentLevel: state.currentLevel, updatedAt: now };
      store.put(updated); // put по ключу обновит запись
      return updated;
    } else {
      const toAdd = { currentLevel: state.currentLevel, updatedAt: now };
      const addReq = store.add(toAdd);
      return await new Promise((resolve, reject) => {
        addReq.onsuccess = () => {
          // addReq.result — id
          toAdd.id = addReq.result;
          resolve(toAdd);
        };
        addReq.onerror = () => reject(addReq.error);
      });
    }
  });
}

// Удалить пользователя (первого найденного)
export async function deleteUserState() {
  return await withStore('users', 'readwrite', async (store) => {
    const existing = await new Promise((resolve, reject) => {
      const getAllReq = store.getAll();
      getAllReq.onsuccess = () => resolve(getAllReq.result[0] || null);
      getAllReq.onerror = () => reject(getAllReq.error);
    });

    if (existing) {
      store.delete(existing.id);
      return true;
    }
    return false;
  });
}

// Получить состояние уровня по levelId
export async function getLevelState(levelId) {
  return await withStore('levels', 'readonly', (store) => {
    return new Promise((resolve, reject) => {
      const idx = store.index('levelId');
      const req = idx.get(levelId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  });
}

// Сохранить xmlAlgorithmConfig для уровня (если есть — обновить, иначе добавить)
export async function saveLevelState(levelId, xmlAlgorithmConfig) {
  return await withStore('levels', 'readwrite', async (store) => {
    const existing = await new Promise((resolve, reject) => {
      const idx = store.index('levelId');
      const req = idx.get(levelId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (existing) {
      const updated = { ...existing, xmlAlgorithmConfig };
      store.put(updated);
      return updated;
    } else {
      const toAdd = { levelId, xmlAlgorithmConfig };
      const addReq = store.add(toAdd);
      return await new Promise((resolve, reject) => {
        addReq.onsuccess = () => {
          toAdd.id = addReq.result;
          resolve(toAdd);
        };
        addReq.onerror = () => reject(addReq.error);
      });
    }
  });
}

// Удалить уровень по levelId
export async function deleteLevelState(levelId) {
  return await withStore('levels', 'readwrite', async (store) => {
    const existing = await new Promise((resolve, reject) => {
      const idx = store.index('levelId');
      const req = idx.get(levelId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (existing) {
      store.delete(existing.id);
      return true;
    }
    return false;
  });
}

// Очистить базу данных (для отладки)
export async function clearDatabase() {
  return new Promise((resolve, reject) => {
    const deleteReq = indexedDB.deleteDatabase(DB_NAME);
    deleteReq.onsuccess = () => {
      console.log('База данных очищена');
      dbPromise = null; // Сбрасываем кэш
      resolve();
    };
    deleteReq.onerror = () => {
      console.error('Ошибка при очистке базы данных:', deleteReq.error);
      reject(deleteReq.error);
    };
  });
}

// Экспорт "по умолчанию" в стиле вашего Dexie-класса
const db = {
  openDB,
  getUserState,
  saveUserState,
  deleteUserState,
  getLevelState,
  saveLevelState,
  deleteLevelState,
  clearDatabase,
};

export default db;
