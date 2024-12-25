const filterSelect = document.getElementById('filter');
const searchInput = document.getElementById('search');
const searchButton = document.getElementById('searchButton');
const resultsContainer = document.getElementById('resultsContainer');
let jsonData = [];
let headers = {};

// ملفات CSV المطلوب استدعاؤها
const csvFiles = {
    'علمي': './data_science.csv',
    'ادبي': './data_arts.csv',
    'تاسع': './data_general.csv'
};

// تحميل البيانات من الملفات
function loadData() {
    const promises = Object.entries(csvFiles).map(([branch, file]) =>
        fetch(file)
            .then(response => response.text())
            .then(csv => {
                const lines = csv.split('\n');
                const fileHeaders = lines[0].split(',').map(header => header.trim());
                headers[branch] = [...fileHeaders, 'النتيجة']; // إضافة عمود "النتيجة" للرؤوس
                const data = lines.slice(1)
                    .map(line => line.split(',').map(item => item.trim()))
                    .filter(line => line.some(item => item !== "")) // تجاهل الصفوف غير الصالحة
                    .map(row => ({ data: row, branch })); // تضمين الفرع
                return data;
            })
            .catch(error => {
                console.error(`Error loading CSV file ${file}:`, error);
                return [];
            })
    );

    Promise.all(promises).then(results => {
        jsonData = results.flat();
        console.log('All data loaded into jsonData:', jsonData);
    });
}

// استدعاء البيانات عند تحميل الصفحة
loadData();

// عرض النتائج عند النقر على زر البحث
searchButton.addEventListener('click', () => {
    resultsContainer.innerHTML = '<p style="text-align: center; color: White;">جاري البحث، يرجى الانتظار...</p>';
    setTimeout(() => { displayResults(); }, 3000); // تأخير بسيط لمحاكاة التحميل
});

function displayResults() {
    resultsContainer.innerHTML = '';
    const filterValue = filterSelect.value.trim().toLowerCase();
    const searchValue = searchInput.value.trim();

    if (!filterValue || !searchValue) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: White;">الرجاء اختيار الفرع وإدخال رقم الاكتتاب والضغط على زر البحث لعرض النتيجة.</p>';
        return;
    }

    let resultFound = false;

    jsonData.forEach((item, index) => {
        const data = item.data;
        const branch = item.branch.toLowerCase(); // الفرع من البيانات
        const enrollmentNumber = data[0]?.trim(); // رقم الاكتتاب

        if (branch === filterValue && enrollmentNumber === searchValue) {
            const totalScore = parseInt(data[10]) || 0; // المجموع الإجمالي
            const arabicScore = parseInt(data[5]) || 0; // درجة العربي
            const passingScore = getPassingScore(branch); // درجة النجاح للفرع
            const arabicPassingScore = getPassingScore('عربي'); // درجة النجاح للعربي

            const resultDiv = document.createElement('div');
            resultDiv.className = 'result';

            // عرض الاسم فوق الجدول فقط
            const studentName = document.createElement('h2');
            studentName.textContent = `الاسم: ${data[1]}`;
            resultDiv.appendChild(studentName);

            const table = document.createElement('table');
            table.className = "table1 table-bordered1";

            // إنشاء صف الرؤوس بناءً على الفرع
            const headerRow = table.insertRow();
            headers[branch].forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });

            // إضافة صف البيانات ديناميكيًا
            const dataRow = table.insertRow();
            data.forEach((value) => {
                const td = dataRow.insertCell();
                td.textContent = value || 'غير متوفر';
            });

            // إضافة خلية "النتيجة" بناءً على حالة النجاح أو الرسوب
            const statusTd = dataRow.insertCell();
            if (totalScore < passingScore || arabicScore < arabicPassingScore) {
                statusTd.className = 'result-status fail';
                statusTd.textContent = arabicScore < arabicPassingScore
                    ? 'راسب (العربي)'
                    : 'راسب';
            } else {
                statusTd.className = 'result-status success';
                statusTd.textContent = 'ناجح';
            }

            resultDiv.appendChild(table);
            resultsContainer.appendChild(resultDiv);
            resultFound = true;
        }
    });

    if (!resultFound) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: White;">لم يتم العثور على نتيجة بهذا الرقم والفرع.</p>';
    }
}

// دالة لحساب درجة النجاح بناءً على الفرع
function getPassingScore(branch) {
    const maxScores = {
        'علمي': 2900,
        'أدبي': 2700,
        'تاسع': 3100,
        'عربي': 400 // درجة النجاح في مادة العربي
    };
    const passingPercentage = 0.4; // نسبة النجاح 40%
    return Math.ceil(maxScores[branch] * passingPercentage); // تقريب لأعلى
}
