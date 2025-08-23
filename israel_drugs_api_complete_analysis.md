# Israel Drugs API - מחקר מקיף ומלא

## 📋 מידע כללי
- **Base URL:** `https://israeldrugs.health.gov.il/GovServiceList/IDRServer`
- **API Type:** REST API עם POST requests
- **Content-Type:** `application/json`
- **תמיכה בשפות:** עברית ואנגלית מלאה
- **סטטוס:** ✅ פעיל ועובד (נבדק ב-22/08/2025)
- **Images Base URL:** `https://mohpublic.z6.web.core.windows.net/IsraelDrugs/`

---

## 🔍 רשימת Endpoints מלאה (12 endpoints)

### **חיפוש ו-Autocomplete:**
1. ✅ **SearchBoxAutocomplete** - השלמה אוטומטית
2. ✅ **SearchByName** - חיפוש תרופות לפי שם
3. ✅ **SearchBySymptom** - חיפוש לפי סימפטומים
4. ✅ **SearchGeneric** - חיפוש מתקדם (ATC, דרכי מתן, אריזות)

### **פרטי תרופות:**
5. ✅ **GetSpecificDrug** - פרטים מלאים על תרופה
6. ✅ **Get Drug Image** - תמונות תרופות (GET)

### **סימפטומים:**
7. ✅ **GetBySymptom** - כל הסימפטומים במערכת
8. ✅ **GetFastSearchPopularSymptoms** - סימפטומים פופולריים

### **רשימות עזר:**
9. ✅ **GetAtcList** - קודי ATC (1,172 קודים)
10. ✅ **GetPackageList** - סוגי אריזות (557 סוגים)
11. ✅ **GetMatanList** - דרכי מתן (105 דרכים)

### **תוכן מולטימדיה:**
12. ❌ **Videos** - רשימה ריקה בכל הבדיקות

---

## 🧪 בדיקות שבוצעו - סיכום מקיף

### **SearchBoxAutocomplete**

#### **מבנה Request:**
```json
{
    "val": "קונסר",                    // טקסט לחיפוש (עברית/אנגלית)
    "isSearchTradeName": "1",          // "1" = חיפוש בשמות מסחריים
    "isSearchTradeMarkiv": "1"         // "1" = חיפוש בחומרים פעילים
}
```

#### **מבנה Response:**
```json
{
    "results": [
        "string", // רשימת הצעות השלמה
        "string"
    ]
}
```

#### **לוגיקת פרמטרים:**
- **isSearchTradeName="1"** + **isSearchTradeMarkiv="1"** = חיפוש משולב (הכי רחב)
- **isSearchTradeName="1"** + **isSearchTradeMarkiv="0"** = רק שמות מסחריים
- **isSearchTradeName="0"** + **isSearchTradeMarkiv="1"** = רק חומרים פעילים
- **isSearchTradeName="0"** + **isSearchTradeMarkiv="0"** = תוצאה ריקה

#### **דוגמאות מוכחות:**
- **"קונסר"** מחזיר: קונסרטה 18/27/36/54 מ"ג (שמות מסחריים)
- **"METHYL"** מחזיר: 28 חומרים פעילים כולל METHYLPHENIDATE
- **שילוב** של "METHYL" מחזיר: 47 תוצאות (חומרים + שמות מסחריים)

---

### **SearchByName**

#### **מבנה Request:**
```json
{
    "val": "אקמול",                   // שם תרופה (עברית/אנגלית)
    "prescription": false,             // !!! LOGIC הפוך - ראה הסבר למטה
    "healthServices": false,           // true = רק תרופות בסל הבריאות
    "pageIndex": 1,                   // !!! מתחיל מ-1 (לא 0)
    "orderBy": 0                      // סוג מיון: 0,1,5 נבדקו
}
```

#### **מבנה Response:**
```json
{
    "hasNonSubsDrugs": null | false,
    "results": [
        {
            "dbVersiob": "5.14",
            "dragRegNum": "020 16 20534 00",        // מפתח ייחודי חשוב!
            "dragRegDate": "31.07.2024",            // תאריך רישום
            "dragHebName": "אקמול",                  // שם עברי
            "dragEnName": "ACAMOL",                 // שם אנגלי
            "dosageForm": "טבליה",                  // צורת מתן
            "dosageFormEng": "TABLETS",             // צורת מתן באנגלית
            "bitulDate": "01/01/1900",              // תאריך ביטול
            "iscanceled": false,                    // האם מבוטלת
            "prescription": false,                  // נדרש מרשם
            "usageForm": "פומי",                    // דרך מתן
            "usageList": ["פומי"],                  // רשימת דרכי מתן
            "activeComponents": [
                {
                    "componentName": "PARACETAMOL 500 MG"
                }
            ],
            "secondarySymptom": "string | null",   // תיאור סימפטום בעברית
            "packages": ["20 TABLETS", "100 TABLETS"], // גדלי אריזות
            "packagesPrices": ["14.12", "0"],      // מחירים מקבילים
            "customerPrice": "14.12",              // מחיר צרכן מקסימלי
            "singlePrice": "0.706",                // מחיר ליחידה
            "images": [
                {
                    "url": "Rishum_16_344623620.jpg"  // שם קובץ תמונה
                }
            ],
            "health": true,                        // בסל הבריאות
            "route": "פומי",                       // דרך מתן
            "pages": 1,                           // מספר עמודים כולל
            "results": 4,                         // מספר תוצאות כולל
            "dragRegOwner": "TEVA ISRAEL LTD",    // חברה בעלת רישום
            "barcodes": "7290000800028",          // ברקודים
            "indications": "Relief of pain and fever...", // אינדיקציות
            "activeComponentsDisplayName": "PARACETAMOL 500 MG",
            "activeComponentsCompareName": "PARACETAMOL"
        }
    ]
}
```

#### **🚨 תגליות קריטיות:**

##### **prescription Parameter - ההבנה המדויקת!**
- **`prescription: false`** = מציג **כל התרופות** (עם ובלי מרשם)
- **`prescription: true`** = מציג **רק תרופות ללא מרשם** (`"prescription": false` בתוצאות)

**הוכחות:**
- **קונסרטה + prescription=false**: 4 תרופות עם מרשם (`"prescription": true`)
- **קונסרטה + prescription=true**: תוצאה ריקה (כי קונסרטה דורשת מרשם)
- **פנדול + prescription=true**: 1 תרופה ללא מרשם (`"prescription": false`)
- **פנדול + prescription=false**: אותה תרופה בדיוק (כי אין פנדול עם מרשם)

**המסקנה:** הפרמטר עובד כמסנן - true מסנן רק תרופות ללא מרשם!

##### **healthServices Parameter:**
- **`healthServices: false`** = כל התרופות
- **`healthServices: true`** = **רק תרופות בסל הבריאות** (health=true)
- דוגמה: אקמול 13→5 תרופות כשמסננים לסל

##### **pageIndex מתחיל מ-1:**
- **pageIndex=0** מחזיר תוצאה ריקה
- **pageIndex=1** = עמוד ראשון
- בניגוד לרוב ה-APIs!

##### **orderBy משפיע על מיון:**
- **orderBy=0**: מיון לפי dragRegNum
- **orderBy=1**: מיון שונה
- **orderBy=5**: מיון אחר (אולי פופולריות)

#### **שדות משתנים לפי סוג תרופה:**

##### **תרופות עם מרשם (prescription: true):**
- `packages`, `packagesPrices`: **ריקים []**
- `customerPrice`, `singlePrice`: **"0"**
- `images`: **ריק [] (לרוב)**
- `barcodes`: **"" (ריק)**
- `secondarySymptom`: **null**

##### **תרופות ללא מרשם (prescription: false):**
- `packages`: **מלא** בגדלי אריזות
- `packagesPrices`: **מלא** במחירים (יכול להכיל "0")
- `customerPrice`: **מחיר ממשי**
- `singlePrice`: **מחיר מחושב ליחידה**
- `images`: **מערך תמונות** (יכול להיות ריק)
- `barcodes`: **ברקודים ממשיים**
- `secondarySymptom`: **תיאור בעברית** (יכול להיות null)

---

### **SearchBySymptom**

#### **מבנה Request:**
```json
{
    "primarySymp": "אף-אוזן-גרון",       // קטגוריה ראשית
    "secondarySymp": "כאבי גרון",        // סימפטום ספציפי
    "healthServices": false,              // רק תרופות בסל
    "pageIndex": 1,                      // מתחיל מ-1
    "prescription": true,                // !!! הפוך - true = ללא מרשם
    "orderBy": 5                         // סוג מיון
}
```

#### **מבנה Response:**
```json
{
    "hasNonSubsDrugs": null | false,
    "results": [
        // מבנה זהה לחלוטין ל-SearchByName!
        // כל השדות זהים
    ]
}
```

#### **תגליות:**
- **מבנה תגובה זהה ל-SearchByName**
- **prescription logic זהה** (הפוך)
- **healthServices עובד זהה**
- **orderBy משפיע על סדר התוצאות**

#### **דוגמאות מוכחות:**
- **"כאבי גרון"**: 8 תרופות לכסניות (סטרפסילס, למוסין)
- **"אלרגיה"**: 8 תרופות (כולן בסל הבריאות)
- **orderBy=0 vs orderBy=5**: סדר שונה של אותן תרופות

---

### **SearchGeneric**

#### **מבנה Request:**
```json
{
    "val": "PARACETAMOL",             // חומר פעיל או ריק
    "matanId": 17,                    // מזהה דרך מתן (מ-GetMatanList)
    "packageId": 21,                  // מזהה אריזה (מ-GetPackageList)
    "atcId": "N02BE",                 // קוד ATC רמה 4 (לא 5!)
    "pageIndex": 1,                   // מתחיל מ-1
    "orderBy": 1                      // סוג מיון
}
```

#### **מבנה Response:**
```json
[
    // מבנה זהה לחלוטין ל-SearchByName results!
    // כל השדות זהים
]
```

#### **🔑 תגליות קריטיות:**

##### **ATC Codes - רמה 4 בלבד!**
- ✅ **"N02BE"** (4 תווים, רמה 4) = 54 תרופות PARACETAMOL
- ✅ **"C09AA"** (4 תווים, רמה 4) = 23 תרופות ACE Inhibitors
- ❌ **"N02BE01"** (6 תווים, רמה 5) = תוצאה ריקה
- **SearchGeneric עובד עם קבוצות תרפויטיות, לא חומרים ספציפיים!**

##### **matanId עם תוצאות ענקיות:**
- **matanId=17 (פומי)**: 2,861 תרופות, 287 עמודים!
- **matanId=16 (אוזני)**: תוצאות קטנות יותר

##### **שילובי פרמטרים:**
- **ATC בלבד**: עובד מעולה
- **matanId בלבד**: עובד מעולה
- **val + matanId + atcId**: עלול להחזיר תוצאה ריקה (מסנן יותר מדי)

#### **דוגמאות מוכחות:**
- **PARACETAMOL (N02BE)**: 54 תרופות - פנדול, אקמול, פרקוסט, ספסמלגין
- **ACE Inhibitors (C09AA)**: 23 תרופות - אסריל, אנלדקס, טריטייס
- **פומי (matanId=17)**: 2,861 תרופות מכל הסוגים

---

### **GetSpecificDrug**

#### **מבנה Request:**
```json
{
    "dragRegNum": "020 16 20534 00"   // מספר רישום מ-SearchByName
}
```

#### **מבנה Response מלא:**
```json
{
    "dragRegNum": "020 16 20534 00",
    "dragHebName": "אקמול",
    "dragEnName": "ACAMOL",
    "bitulDate": "01/01/1900",
    "isCytotoxic": false,
    "isVeterinary": false,
    "applicationType": "תכשיר גנרי",
    "brochure": [
        {
            "lng": "עברית" | "אנגלית" | "ערבית" | "רוסית" | null,
            "url": "Rishum01_3_730850422.pdf",
            "updateDate": 1652692303000.0,
            "type": "החמרה לעלון" | "עלון לצרכן" | "עלון לרופא",
            "display": "עלון לצרכן עברית",
            "updateDateFormat": "16.05.2022",
            "creationDateFormat": "18.01.2022"
        }
    ],
    "brochureUpdate": null,
    "isPrescription": false,
    "iscanceled": false,
    "images": [
        {
            "url": "Rishum_16_344623620.jpg",
            "updateDate": 1598267549000.0
        }
    ],
    "usageFormHeb": "פומי",
    "usageFormEng": "PER OS",
    "dosageForm": "טבליה",
    "dosageFormEng": "TABLETS",
    "dragIndication": "Relief of pain and fever...",
    "maxPrice": 14.12,                    // מחיר כמספר (לא string)
    "health": true,
    "activeMetirals": [                   // שם שדה שונה!
        {
            "ingredientsDesc": "PARACETAMOL",
            "dosage": "500 MG"
        }
    ],
    "regOwnerName": "TEVA ISRAEL LTD",
    "regManufactureName": "TEVA ISRAEL LTD, ISRAEL",
    "regDate": 1722384000000.0,          // timestamp
    "regExpDate": 253402214400000.0,
    "applicationDate": -122256000000.0,
    "custom": "",
    "manufacturers": [
        {
            "manufactureName": "TEVA PHARMACEUTICAL INDUSTRIES LTD, ISRAEL",
            "manufactureSite": "18 ELI HURVITZ ST., INDUSTRIAL ZONE, KFAR SABA 4410202, ISRAEL",
            "manufactureComments": "All manufacturing activities"
        }
    ],
    "limitations": "תרופה שאושרה לשימוש כללי בקופ'ח",
    "dateOfInclusion": "01/01/1995",
    "indicationIncludedInTheBasket": "",
    "classEffect": "",
    "remarks": "",
    "packingLimitation": "",
    "registeredIndicationsAtTimeOfInclusion": "Analgesic and antipyretic.",
    "frameworkOfInclusion": "",
    "useInClalit": "Mild to moderate pain, antipyretic",
    "salList": [],
    "atc": [
        {
            "atc4Code": "N02BE  ",           // עם רווחים!
            "atc4Name": "ANILIDES",
            "atc5Code": "N02BE01",           // ללא רווחים
            "atc5Name": "PARACETAMOL"
        }
    ],
    "packages": [
        {
            "isPrescription": boolean,
            "packageUpdate": 0.0,
            "packageDesc": "BLISTER PVC/ALUMINIUM",
            "packMaterialDesc": "PVC/ALUMINIUM",
            "unitPrice": 0.706,             // מחיר כמספר
            "packageMaxPrice": 14.12,       // מחיר כמספר
            "quantity": "20 TABLETS",
            "shelfLife": "36",              // חודשים
            "unit": "חדשים",
            "barcode": "7290000800028"
        }
    ],
    "videos": []                           // תמיד ריק
}
```

#### **תגליות:**
- **המידע הכי עשיר** - עלונים, יצרנים, ATC מלא
- **עלונים בשפות שונות** - עברית, אנגלית, ערבית, רוסית
- **פרטי יצרן מלאים** עם כתובות
- **מחירים כמספרים** (לא strings כמו ב-SearchByName)
- **שם שדה שונה**: activeMetirals (לא activeComponents)

---

### **GetBySymptom**

#### **מבנה Request:**
```json
{
    "prescription": true    // בכל הבדיקות השתמשנו ב-true
}
```

#### **מבנה Response:**
```json
[
    {
        "bySymptomMain": "אף-אוזן-גרון",      // קטגוריה ראשית
        "list": [
            {
                "bySymptomSecond": 16,          // מזהה ייחודי
                "bySymptomName": "כאבי גרון"   // שם הסימפטום
            }
        ]
    }
]
```

#### **תגליות:**
- **25 קטגוריות ראשיות**
- **112 סימפטומים משניים**
- **מבנה היררכי** - קטגוריה ורשימת סימפטומים
- **bySymptomSecond = מזהה ייחודי** לכל סימפטום

#### **דוגמאות מרכזיות:**
- **"אף-אוזן-גרון"**: 20 סימפטומים כולל כאבי גרון, גודש באף
- **"שיכוך כאבים והורדת חום"**: 11 סימפטומים שונים
- **"אלרגיה"**: סימפטום יחיד
- **"בעיות עיכול"**: 12 סימפטומים

---

### **GetFastSearchPopularSymptoms**

#### **מבנה Request:**
```json
{
    "rowCount": 10    // מספר תוצאות מבוקש
}
```

#### **מבנה Response:**
```json
[
    {
        "bySymptomMain": "אף-אוזן-גרון",
        "bySymptomSecond": 16,              // זהה ל-GetBySymptom
        "bySymptomName": "כאבי גרון",
        "order": 12532                      // מספר חיפושים/פופולריות
    }
]
```

#### **הסימפטומים הפופולריים (Top 10):**
1. **כאבי גרון** (12,532 חיפושים)
2. **אנטי פטרייתי לעור** (10,099)
3. **הקלת עצירות** (8,295)
4. **אלרגיה** (7,353)
5. **שכוך כאבים בחלל הפה** (6,346)
6. **הזעת יתר** (4,098)
7. **הרגעה ומשרה שינה** (807)
8. **טיפול מקומי לשיכוך כאבי שרירים ופרקים** (559)
9. **אנטי פטרייתי לציפורניים** (539)
10. **הקלת שיעול** (525)

---

### **רשימות עזר (GetAtcList, GetPackageList, GetMatanList)**

#### **GetAtcList Response:**
```json
[
    {
        "id": "B06AX",                     // קוד ATC
        "text": "OTHER HEMATOLOGICAL AGENTS" // תיאור באנגלית
    }
]
```
**סה"כ:** 1,172 קודי ATC

#### **GetPackageList Response:**
```json
[
    {
        "id": 0,                          // מזהה אריזה
        "text": "AEROSOL"                 // תיאור אריזה
    }
]
```
**סה"כ:** 557 סוגי אריזות

#### **GetMatanList Response:**
```json
[
    {
        "id": 16.0,                       // מזהה דרך מתן
        "text": "אוזני"                    // תיאור בעברית
    }
]
```
**סה"כ:** 105 דרכי מתן

#### **דרכי מתן מרכזיות:**
- **17**: פומי
- **16**: אוזני
- **15**: עיני
- **6**: תוך-ורידי
- **5**: תוך-שרירי
- **2**: עורי
- **18**: רקטלי

---

### **Get Drug Images**

#### **URL Structure:**
```
https://mohpublic.z6.web.core.windows.net/IsraelDrugs/{imageFileName}
```

#### **דוגמה:**
```
https://mohpublic.z6.web.core.windows.net/IsraelDrugs/Rishum_16_344623620.jpg
```

#### **תגליות:**
- **URL עובד מצוין** - מחזיר תמונות ממשיות
- **שמות קבצים עקביים** בין endpoints
- **פורמטים**: .jpg, .jpeg
- **תמונות קיימות** רק לחלק מהתרופות

---

## 🔗 קשרים וחיבורים בין Endpoints

### **dragRegNum - המפתח הראשי:**
1. **SearchByName** מחזיר `dragRegNum: "020 16 20534 00"`
2. **GetSpecificDrug** מקבל אותו dragRegNum ומחזיר פרטים מלאים
3. **קשר ישר 1:1** - dragRegNum הוא המפתח הייחודי

### **מערכת הסימפטומים:**
1. **GetBySymptom** מחזיר `bySymptomMain: "אף-אוזן-גרון"`
2. **GetBySymptom** מחזיר `bySymptomName: "כאבי גרון"`
3. **SearchBySymptom** מקבל `primarySymp` ו-`secondarySymp`
4. **GetFastSearchPopularSymptoms** מחזיר אותם bySymptomSecond IDs

### **רשימות עזר ↔ SearchGeneric:**
1. **GetMatanList** מחזיר `id: 17, text: "פומי"`
2. **SearchGeneric** מקבל `matanId: 17`
3. **GetAtcList** מחזיר `id: "N02BE"`
4. **SearchGeneric** מקבל `atcId: "N02BE"`

### **ATC Codes - קשר מורכב:**
1. **GetSpecificDrug** מחזיר `atc4Code: "N02BE  "` (עם רווחים)
2. **GetSpecificDrug** מחזיר `atc5Code: "N02BE01"` (ללא רווחים)
3. **SearchGeneric** עובד עם **ATC4 בלבד** (ללא רווחים)
4. **GetAtcList** מכיל את כל הקודים הזמינים

### **תמונות - קשר עקבי:**
1. **SearchByName** מחזיר `images: [{"url": "Rishum_16_344623620.jpg"}]`
2. **GetSpecificDrug** מחזיר `images: [{"url": "Rishum_16_344623620.jpg", "updateDate": timestamp}]`
3. **URL מלא:** `https://mohpublic.z6.web.core.windows.net/IsraelDrugs/Rishum_16_344623620.jpg`

---

## 🔄 זרימות עבודה מלאות

### **זרימה #1: Autocomplete Search Workflow**

#### **מטרה:** השלמה אוטומטית מהירה בעת הקלדה
```json
// SearchBoxAutocomplete
{
    "val": "קונסר",                    // טקסט חלקי
    "isSearchTradeName": "1",          // שמות מסחריים
    "isSearchTradeMarkiv": "1"         // חומרים פעילים
}
```
**תוצאה:** רשימת הצעות מהירה לממשק המשתמש

### **זרימה #2: Basic Drug Search Workflow**

#### **שלב 1: חיפוש ראשוני**
```json
// SearchByName
{
    "val": "אקמול",
    "prescription": false,             // כל התרופות
    "healthServices": false,           // כל התרופות (לא רק בסל)
    "pageIndex": 1,
    "orderBy": 0
}
```

#### **שלב 2: פרטים מלאים**
```json
// GetSpecificDrug
{
    "dragRegNum": "020 16 20534 00"   // מהתוצאה הקודמת
}
```

#### **תוצאה:** מידע מלא על תרופה כולל עלונים, יצרנים, מחירים

### **זרימה #3: Symptom Search Workflow**

#### **שלב 1: קבלת כל הסימפטומים**
```json
// GetBySymptom
{"prescription": true}
```

#### **שלב 2: (אופציונלי) הפופולריים**
```json
// GetFastSearchPopularSymptoms
{"rowCount": 10}
```

#### **שלב 3: חיפוש לפי סימפטום**
```json
// SearchBySymptom
{
    "primarySymp": "אף-אוזן-גרון",    // מ-bySymptomMain
    "secondarySymp": "כאבי גרון",     // מ-bySymptomName
    "healthServices": false,
    "pageIndex": 1,
    "prescription": true,             // ללא מרשם
    "orderBy": 5
}
```

### **זרימה #4: Advanced Generic Search Workflow**

#### **שלב 1: קבלת רשימות עזר**
```json
// GetAtcList
{}

// GetMatanList  
{}

// GetPackageList
{}
```

#### **שלב 2: חיפוש מתקדם**
```json
// SearchGeneric
{
    "val": "",                        // ריק או חומר פעיל
    "matanId": 17,                    // פומי מ-GetMatanList
    "packageId": null,                // אריזה מ-GetPackageList
    "atcId": "N02BE",                 // ATC4 מ-GetAtcList/GetSpecificDrug
    "pageIndex": 1,
    "orderBy": 1
}
```

#### **תוצאה:** חיפוש תחליפים גנריים וקבוצות תרפויטיות

---

## 🚨 תכונות מיוחדות ומלכודות

### **prescription Parameter - היגיון הפוך:**
- **`prescription: false`** = מציג **כל התרופות**
- **`prescription: true`** = מציג **רק תרופות ללא מרשם**
- **זה הפוך לגמרי מהצפוי!**

### **pageIndex מתחיל מ-1:**
- **pageIndex=0** = תוצאה ריקה
- **pageIndex=1** = עמוד ראשון
- שונה מרוב ה-APIs

### **ATC Codes - רמה 4 בלבד:**
- ✅ **"N02BE"** (4 תווים) = עובד
- ❌ **"N02BE01"** (6 תווים) = לא עובד
- SearchGeneric עובד עם קבוצות, לא חומרים ספציפיים

### **healthServices = סל הבריאות:**
- **`healthServices: true`** = רק תרופות מסובסדות
- **שדה `health`** בתגובה מציין סטטוס סל הבריאות

### **תרופות מבוטלות:**
- **`iscanceled: true`** = תרופה הוסרה מהשוק
- **`bitulDate`** = תאריך הביטול
- **עדיין מוצגות בתוצאות!**

### **מחירים - פורמטים שונים:**
- **SearchByName:** מחירים כ-strings ("14.12")
- **GetSpecificDrug:** מחירים כ-numbers (14.12)

### **orderBy משפיע על מיון:**
- **orderBy=0/1/5** נבדקו - כל אחד נותן סדר שונה
- חשוב למשתמשים שרוצים סידור ספציפי

---

## 📊 נתונים סטטיסטיים

### **גדלי מאגרים:**
- **ATC Codes:** 1,172 קודים
- **Package Types:** 557 סוגי אריזות  
- **Administration Routes:** 105 דרכי מתן
- **Symptom Categories:** 25 קטגוריות ראשיות
- **Total Symptoms:** 112 סימפטומים משניים

### **תוצאות חיפוש לדוגמה:**
- **אקמול (כל):** 13 תרופות
- **אקמול (בסל):** 5 תרופות
- **אלרגיה:** 8 תרופות (כולן בסל)
- **כאבי גרון:** 8 תרופות לכסניות
- **PARACETAMOL (קבוצה):** 54 תרופות
- **ACE Inhibitors:** 23 תרופות
- **תרופות פומיות:** 2,861 תרופות!

### **pagination דוגמאות:**
- **רוב החיפושים:** 1 עמוד
- **PARACETAMOL:** 6 עמודים (54 תרופות)
- **ACE Inhibitors:** 3 עמודים (23 תרופות)
- **תרופות פומיות:** 287 עמודים (2,861 תרופות)

---

## 🎯 יעדי MCP Server

### **תכונות חיוניות:**
1. **חיפוש אוטו-קומפליט** עם בחירת סוג החיפוש
2. **חיפוש בסיסי** עם הבנת prescription logic ההפוך
3. **חיפוש לפי סימפטומים** עם ממשק היררכי
4. **חיפוש מתקדם** עם ATC/דרכי מתן/אריזות
5. **פרטי תרופה מלאים** כולל עלונים ותמונות
6. **מסנני סל הבריאות** לתרופות מסובסדות
7. **טיפול בתרופות מבוטלות** עם אזהרות

### **ממשקי משתמש:**
1. **רשימות בחירה** מרשימות העזר
2. **הצגת תמונות** עם URL מלא
3. **סינון מתקדם** עם הבנת ההיגיון
4. **pagination נכון** (מ-1)
5. **מיון משתמש** עם orderBy

### **תכונות מתקדמות:**
1. **השוואת תרופות** בין תוצאות
2. **חיפוש תחליפים** עם SearchGeneric
3. **מידע קליני** מעלונים ואינדיקציות
4. **מעקב מחירים** והשוואות
5. **התרעות בטיחות** לתרופות מבוטלות

---

## 🔍 דוגמאות קונקרטיות מוכחות

### **אקמול - מקרה מורכב:**
- **13 וריאציות** שונות (טבליות, קפליות, סירופים, שילובים)
- **5 בסל הבריאות** מתוך 13
- **מחירים:** 14.12-58.5 ש"ח
- **קוד-אקמול** עם CODEINE - היחיד עם מרשם בסל

### **קונסרטה - תרופת ADHD:**
- **4 מינונים** (18/27/36/54 מ"ג)
- **כולן עם מרשם** ובסל הבריאות
- **חברה יחידה:** J-C HEALTH CARE LTD
- **dragRegNum עוקבים** אך לא רציפים

### **אלרגיה - תרופות אנטיהיסטמיניות:**
- **8 תרופות שונות** (טבליות וסירופים)
- **כולן בסל הבריאות**
- **2 חומרים עיקריים:** LORATADINE ו-CETIRIZINE
- **חברות שונות:** TEVA, BAYER, DEXCEL, TRIMA

### **כאבי גרון - לכסניות:**
- **8 תרופות מקומיות**
- **2 סוגים עיקריים:** סטרפסילס ולמוסין
- **רכיבים:** LIDOCAINE, TYROTHRICIN, DICHLOROBENZYL ALCOHOL
- **אף אחת לא בסל** (health=false לכולן)

### **PARACETAMOL - קבוצה תרפויתית:**
- **54 תרופות שונות** מ-ATC "N02BE"
- **טווח רחב:** פנדול פשוט עד פרקוסט עם OXYCODONE
- **דרכי מתן:** פומי, תוך-ורידי, רקטלי
- **עוצמות שונות:** 150-500 מ"ג

### **תרופות מבוטלות:**
- **אופטלגין קפליות** בוטל ב-14/01/2025
- **עדיין מוצג בתוצאות** עם `iscanceled: true`
- **חשוב לזיהוי ואזהרה למשתמשים**

---

*מחקר הושלם ב-22/08/2025 - כולל את כל הממצאים, הקשרים והתובנות*