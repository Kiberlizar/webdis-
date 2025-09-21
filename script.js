document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".tab");
  const tableBody = document.getElementById("settings-table-body");
  const addForm = document.getElementById("add-form");
  const settingNameInput = document.getElementById("setting-name");
  const settingCurrencySelect = document.getElementById("setting-currency");

  // --- 1. Управління даними ---

  // Початкові дані, якщо в localStorage нічого немає
  const initialSettings = [
    {
      id: 1,
      name: "BTC increase each 2 sec for T-Shirts",
      currency: "BTC",
      status: "Draft",
    },
    {
      id: 2,
      name: "USDT decrease each 1 sec for Hoodies",
      currency: "USDT",
      status: "Active",
    },
    {
      id: 3,
      name: "TON based for merch each 1 min",
      currency: "TON",
      status: "Active",
    },
  ];

  // Завантаження налаштувань з localStorage або використання початкових
  let settings =
    JSON.parse(localStorage.getItem("coinSyncSettings")) || initialSettings;
  let currentFilter = "all";

  // Функція збереження налаштувань в localStorage
  const saveSettings = () => {
    localStorage.setItem("coinSyncSettings", JSON.stringify(settings));
  };

  // --- 2. Рендеринг таблиці ---

  const renderTable = () => {
    tableBody.innerHTML = ""; // Очищуємо таблицю перед рендерингом

    const filteredSettings = settings.filter((setting) => {
      if (currentFilter === "all") return true;
      if (currentFilter === "active")
        return setting.status.toLowerCase() === "active";
      return setting.currency.toLowerCase() === currentFilter.toLowerCase();
    });

    if (filteredSettings.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="3" style="text-align: center;">No settings found.</td></tr>';
      return;
    }

    filteredSettings.forEach((setting) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><a href="#">${setting.name}</a></td>
        <td>${setting.status}</td>
        <td><img src="images/trash.webp" alt="Remove" width="20" data-id="${setting.id}" class="remove-icon"></td>
      `;
      tableBody.appendChild(row);
    });
  };

  // --- 3. Обробники подій ---

  // Фільтрація (вкладки)
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      currentFilter = tab.dataset.filter;
      renderTable();
    });
  });

  // Додавання нового налаштування
  addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const newName = settingNameInput.value.trim();
    if (!newName) return;

    const newSetting = {
      id: Date.now(), // Унікальний ID на основі часу
      name: newName,
      currency: settingCurrencySelect.value,
      status: "Draft", // Нові налаштування за замовчуванням - чернетки
    };

    settings.push(newSetting);
    saveSettings();
    renderTable();
    addForm.reset();
  });

  // Видалення налаштування (делегування події)
  tableBody.addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-icon")) {
      const settingId = parseInt(event.target.dataset.id, 10);
      settings = settings.filter((setting) => setting.id !== settingId);
      saveSettings();
      renderTable();
    }
  });

  // --- 4. Отримання реальних цін з API ---

  const btcPriceEl = document.getElementById('btc-price');
  const usdtPriceEl = document.getElementById('usdt-price');
  const tonPriceEl = document.getElementById('ton-price');

  const fetchPrices = () => {
    const apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,tether,the-open-network&vs_currencies=usd';

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Оновлюємо ціни на сторінці
        if (data.bitcoin && data.bitcoin.usd) {
          btcPriceEl.textContent = `$${data.bitcoin.usd.toLocaleString()}`;
        }
        if (data.tether && data.tether.usd) {
          usdtPriceEl.textContent = `$${data.tether.usd.toFixed(4)}`;
        }
        if (data['the-open-network'] && data['the-open-network'].usd) {
          tonPriceEl.textContent = `$${data['the-open-network'].usd.toFixed(4)}`;
        }
      })
      .catch(error => {
        console.error('Error fetching prices:', error);
        // Виводимо повідомлення про помилку користувачу
        btcPriceEl.textContent = 'Error';
        usdtPriceEl.textContent = 'Error';
        tonPriceEl.textContent = 'Error';
      });
  };

  // --- Ініціалізація ---

  renderTable(); // Перший рендеринг таблиці
  fetchPrices(); // Перший запит цін
  setInterval(fetchPrices, 5000); // Оновлювати ціни кожні 5 секунд
});
