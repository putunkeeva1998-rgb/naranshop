// --- script.js ---

// 1. КОНФИГУРАЦИЯ
// ⚠️ ВАЖНО: Замените на реальный адрес вашего Python API на хостинге!
const API_URL = 'https://naranwear.ru/api'; 
let cart = JSON.parse(localStorage.getItem('naranCart')) || []; // Загружаем корзину из памяти браузера
let allProducts = []; // Для хранения всех товаров
let map; // Переменная для карты СДЭК

// 2. УПРАВЛЕНИЕ НАВИГАЦИЕЙ (ПЕРЕКЛЮЧЕНИЕ МЕЖДУ РАЗДЕЛАМИ)
function switchPage(pageId) {
    document.querySelectorAll('.page-content').forEach(section => {
        section.classList.add('hidden');
    });
    const targetSection = document.getElementById(pageId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }
    
    // Специальная обработка при переключении
    if (pageId === 'catalog') {
        // Отобразить каталог после возможной фильтрации
        filterByCategory('Все товары'); 
    } else if (pageId === 'cart-page') {
        renderCart(); // Перерисовать корзину
    } else if (pageId === 'contacts-page') {
        // Убедиться, что контакты (с Telegram) видны
        document.getElementById('contacts-page').innerHTML = 
            '<h2>Контакты</h2><p>По всем вопросам пишите нам в Telegram: <a href="https://t.me/optania" target="_blank">@optania</a></p>';
    }
}

// 3. ЗАГРУЗКА И ОТОБРАЖЕНИЕ КАТАЛОГА
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Ошибка загрузки каталога');

        allProducts = await response.json();
        
        renderCategories(allProducts); // Создать кнопки категорий
        filterByCategory('Все товары'); // Показать все товары по умолчанию

    } catch (error) {
        console.error('Не удалось загрузить товары:', error);
        document.getElementById('products-list').innerHTML = 
            '<p>Ошибка: Не удалось загрузить товары с сервера. Проверьте адрес API и запущен ли Python.</p>';
    }
}

function renderProductCard(product) {
    // 💡 Отображение доступных размеров
    const sizesHtml = (product.sizes || ['S', 'M']).map(size => 
        `<option value="${size}">${size}</option>`).join('');

    return `
        <div class="product-card" data-id="${product.id}" data-category="${product.category}">
            <img src="${product.photo_url}" alt="${product.name}" style="width: 100%; max-height: 200px; object-fit: cover;">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p><strong>${product.price} руб.</strong></p>
            
            <div class="product-options">
                <label for="size-${product.id}">Размер:</label>
                <select id="size-${product.id}">
                    ${sizesHtml}
                </select>
            </div>
            <button class="add-to-cart-btn" data-id="${product.id}">Добавить в корзину</button>
        </div>
    `;
}

function renderProducts(productsToRender) {
    const listContainer = document.getElementById('products-list');
    if (!productsToRender || productsToRender.length === 0) {
        listContainer.innerHTML = '<p>В этой категории пока нет товаров.</p>';
    } else {
        listContainer.innerHTML = productsToRender.map(renderProductCard).join('');
    }
}


// 4. ЛОГИКА КОРЗИНЫ
function saveCart() {
    localStorage.setItem('naranCart', JSON.stringify(cart));
}

function addToCart(productId, size) {
    const product = allProducts.find(p => p.id == productId);
    if (!product) return;

    // Создаем уникальный ID для позиции (товар + размер)
    const itemId = `${productId}-${size}`;
    const existingItem = cart.find(item => item.itemId === itemId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            itemId: itemId,
            productId: productId,
            name: product.name,
            price: product.price,
            size: size,
            quantity: 1
        });
    }

    saveCart();
    alert(`"${product.name} (Размер: ${size})" добавлен в корзину!`);
}

function renderCart() {
    const cartItemsList = document.getElementById('cart-items');
    const cartTotalDiv = document.getElementById('cart-total');
    let total = 0;

    if (cart.length === 0) {
        cartItemsList.innerHTML = '<li>Корзина пуста.</li>';
        cartTotalDiv.innerHTML = '';
        return;
    }

    cartItemsList.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `
            <li>
                ${item.name} (${item.size}) x ${item.quantity} — ${itemTotal} руб.
                <button onclick="removeFromCart('${item.itemId}')">Удалить</button>
            </li>
        `;
    }).join('');

    cartTotalDiv.innerHTML = `<h3>Общая сумма: ${total} руб.</h3>`;
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.itemId !== itemId);
    saveCart();
    renderCart();
}

// 5. ЛОГИКА КАТЕГОРИЙ И ФИЛЬТРАЦИИ
function renderCategories(products) {
    const categoriesContainer = document.getElementById('categories-container');
    const allCategories = ['Все товары']; 
    
    // Получаем уникальные категории из товаров
    products.forEach(p => {
        if (!allCategories.includes(p.category)) {
            allCategories.push(p.category);
        }
    });

    // Создаем кнопки
    categoriesContainer.innerHTML = allCategories.map(cat => 
        `<button class="category-btn" data-category="${cat}">${cat}</button>`
    ).join('');
    
    // Подсветка первой кнопки
    document.querySelector('.category-btn').classList.add('active');
}

function filterByCategory(category) {
    const productsToRender = category === 'Все товары'
        ? allProducts
        : allProducts.filter(p => p.category === category);
    
    renderProducts(productsToRender);
    
    // Подсветка активной кнопки
    document.querySelectorAll('.category-btn').forEach(btn => {
        if (btn.dataset.category === category) {
            btn.classList.add('active'); 
        } else {
            btn.classList.remove('active');
        }
    });
}


// 6. ИНИЦИАЛИЗАЦИЯ (Запуск при загрузке страницы)
document.addEventListener('DOMContentLoaded', () => {
    
    // 6.1. Настройка навигации (переключение разделов)
    document.getElementById('main-nav').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' && e.target.dataset.page) {
            switchPage(e.target.dataset.page);
        }
    });
    
    // 6.2. Настройка добавления в корзину (через делегирование)
    document.getElementById('products-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = e.target.dataset.id;
            const sizeSelect = document.getElementById(`size-${productId}`);
            const size = sizeSelect ? sizeSelect.value : 'N/A';
            addToCart(productId, size);
        }
    });
    
    // 6.3. Настройка фильтрации по категориям
    document.getElementById('categories-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('category-btn')) {
            filterByCategory(e.target.dataset.category);
        }
    });
    
    // 6.4. Инициализация оформления заказа (СДЭК)
    document.getElementById('checkout-btn').addEventListener('click', () => {
        // Показать карту и скрыть кнопку оформления
        document.getElementById('map-container').classList.remove('hidden');
        document.getElementById('checkout-btn').classList.add('hidden');
        
        // Инициализация карты Leaflet (только если она еще не инициализирована)
        if (!map) {
            map = L.map('map').setView([55.7558, 37.6173], 10); // Центр: Москва
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            // ⚠️ В реальном проекте здесь будет запрос к API СДЭК и добавление маркеров
        }
        setTimeout(() => map.invalidateSize(), 400); // Исправление отображения карты после скрытия
    });

    // 6.5. Запуск загрузки каталога и показ каталога по умолчанию
    fetchProducts();
    switchPage('catalog'); 
});
