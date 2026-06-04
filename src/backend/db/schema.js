const db = require("./database")

const createTables = () => {
    db.exec(
        `
    CREATE TABLE IF NOT EXISTS REMINDERS(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    time TEXT,
    repeat TEXT DEFAULT 'once' CHECK(repeat IN ('once','daily','weekly','monthly')),
    repeat_day TEXT,
    person_name TEXT,
    phone TEXT,
    is_completed INTEGER DEFAULT 0,
    created TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS CASH(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    density TEXT DEFAULT 'calm' CHECK(density IN ('calm', 'moderate', 'busy'))
    );
    CREATE TABLE IF NOT EXISTS PAYMENTS(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_name TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date TEXT,
    category TEXT,
    is_paid INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS NOTES(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    importance TEXT DEFAULT 'low' CHECK(importance IN ('low',
    'medium', 'critical')),
    reminder_date TEXT,
    created TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS GOALS(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    end_date TEXT,
    category TEXT,
    is_completed INTEGER DEFAULT 0,
    created TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS CUSTOMER_REVIEWS(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    note TEXT NOT NULL,
    tag TEXT DEFAULT 'positive' CHECK(tag IN ('positive', 'negative','suggestion')),
    date TEXT,
    created TEXT DEFAULT (datetime('now'))
    );
    `
    )
    try {
        db.exec(`ALTER TABLE REMINDERS ADD COLUMN snoozed_until TEXT`)
        db.exec(`ALTER TABLE CASH ADD COLUMN title TEXT NOT NULL DEFAULT ''`)
    } catch (err) {

    }
}
createTables()
module.exports = createTables