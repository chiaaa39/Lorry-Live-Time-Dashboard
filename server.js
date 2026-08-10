
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(filePath)) {
      return resolve([]);
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

app.get('/api/dashboard', async (req, res) => {
  try {
    const dataDir = path.join(__dirname, 'data');
    
    // 匹配 GitHub 上实际的文件名（使用空格和 - 符号）
    const staffList = await readCSV(path.join(dataDir, 'Lorry condition - Staff Details.csv'));
    const mainOrders = await readCSV(path.join(dataDir, 'Lorry condition - Sheet1.csv'));
    
    const arrives = {};
    for (let i = 1; i <= 5; i++) {
      arrives[`arrive_${i}`] = await readCSV(path.join(dataDir, `Lorry condition - Arrive ${i}.csv`));
    }

    const mergedData = mainOrders.map(order => {
      const id = order['Inspection ID'];
      const arrivalLogs = [];

      for (let i = 1; i <= 5; i++) {
        const arriveRecords = arrives[`arrive_${i}`].filter(r => r['Inspection ID'] === id);
        arriveRecords.forEach(rec => {
          const photos = [];
          Object.keys(rec).forEach(key => {
            if (key.startsWith('Photo') && rec[key] && rec[key].trim() !== '') {
              photos.push({ label: key, url: rec[key] });
            }
          });

          arrivalLogs.push({
            stage: `Arrive ${i}`,
            time: rec[`Data&Time Arrive ${i}`] || rec[`Data&Time Arrive_${i}`] || '',
            gpsLocation: rec['GPS Location'] || '',
            gpsAddress: rec['GPS Address'] || '',
            status: rec['Status'] || '',
            photos: photos
          });
        });
      }

      return {
        inspectionId: order['Inspection ID'],
        staffName: order['Staff Name'],
        staffEmail: order['Staff Email'],
        lorryPlate: order['Lorry Plate Number'],
        dateTimeBefore: order['Date&Time Before'],
        dateTimeAfter: order['Date&Time After'],
        status: order['Status'],
        arrivals: arrivalLogs
      };
    });

    res.json({
      timestamp: new Date().toISOString(),
      staffs: staffList,
      orders: mergedData
    });
  } catch (error) {
    console.error("Data error:", error);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});