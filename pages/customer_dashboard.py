import streamlit as st

# Check if customer is logged in
if 'logged_in' not in st.session_state or not st.session_state.logged_in or st.session_state.user_type != "customer":
    st.switch_page("pages/user.py")

st.set_page_config(
    page_title="DormDash - Customer Dashboard",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap');

    /* Hide sidebar */
    [data-testid="stSidebar"] {
        display: none;
    }

    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    /* Global styles */
    * {
        font-family: 'Work Sans', sans-serif;
    }

    .stApp {
        background-color: #f8f8f5;
    }

    .main .block-container {
        padding: 0;
        max-width: 100%;
    }

    /* Header */
    .customer-header {
        background-color: #ffffff;
        padding: 1rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .header-logo {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .logo-icon {
        width: 40px;
        height: 40px;
        background-color: #f2b90d;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.25rem;
        font-weight: 700;
    }

    .logo-text {
        font-size: 1.25rem;
        font-weight: 700;
        color: #000000;
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f59e0b, #ef4444);
    }

    /* Content */
    .content-wrapper {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    .section-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #000000;
        margin-bottom: 1.5rem;
    }

    /* Active Order Card */
    .active-order-card {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-radius: 1rem;
        padding: 1.5rem;
        margin-bottom: 2rem;
        position: relative;
    }

    .order-status-badge {
        display: inline-block;
        padding: 0.5rem 1rem;
        border-radius: 2rem;
        background-color: #fbbf24;
        color: #000000;
        font-weight: 700;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }

    .order-restaurant {
        color: #92400e;
        font-weight: 600;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .order-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #000000;
        margin-bottom: 0.5rem;
    }

    .order-details {
        color: #78716c;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }

    .order-total {
        font-size: 1.125rem;
        font-weight: 700;
        color: #000000;
    }

    .food-icon {
        position: absolute;
        right: 2rem;
        top: 2rem;
        font-size: 4rem;
    }

    /* Restaurant Cards */
    .restaurant-card {
        background: white;
        border-radius: 0.75rem;
        padding: 1.25rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 1rem;
        cursor: pointer;
        transition: all 0.3s;
    }

    .restaurant-card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateY(-2px);
    }

    .restaurant-icon {
        width: 80px;
        height: 80px;
        border-radius: 0.5rem;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
    }

    .restaurant-details {
        flex: 1;
    }

    .restaurant-name {
        font-size: 1.125rem;
        font-weight: 700;
        color: #000000;
        margin-bottom: 0.25rem;
    }

    .restaurant-info {
        color: #6b7280;
        font-size: 0.875rem;
    }

    /* Navigation buttons */
    [data-testid="column"] button[kind="secondary"] {
        background-color: transparent !important;
        border: none !important;
        color: #000000 !important;
        font-weight: 600 !important;
        font-size: 0.95rem !important;
        padding: 0.5rem !important;
        box-shadow: none !important;
    }

    [data-testid="column"] button[kind="secondary"]:hover {
        color: #f2b90d !important;
        background-color: transparent !important;
    }

    .nav-link {
        color: #000000;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.95rem;
    }

    .nav-link.active {
        color: #f2b90d;
    }

    .stButton > button[kind="primary"] {
        background-color: #f2b90d !important;
        color: #000000 !important;
        font-weight: 700 !important;
    }
</style>
""", unsafe_allow_html=True)

# Header
header_col1, header_col2, header_col3 = st.columns([1, 2, 1])

with header_col1:
    st.markdown("""
    <div class="customer-header" style="justify-content: flex-start;">
        <div class="header-logo">
            <div class="logo-icon">🎓</div>
            <div class="logo-text">DormDash</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

with header_col2:
    nav_cols = st.columns(3)
    with nav_cols[0]:
        st.markdown('<p class="nav-link active" style="text-align: center; margin-top: 0.75rem;">Home</p>', unsafe_allow_html=True)
    with nav_cols[1]:
        if st.button("Orders", key="nav_orders", use_container_width=True, type="secondary"):
            st.switch_page("pages/customer_orders.py")
    with nav_cols[2]:
        if st.button("Account", key="nav_account", use_container_width=True, type="secondary"):
            st.switch_page("pages/account.py")

with header_col3:
    st.markdown("""
    <div style="display: flex; justify-content: flex-end; padding: 1rem;">
        <div class="user-avatar"></div>
    </div>
    """, unsafe_allow_html=True)

# Content
st.markdown('<div class="content-wrapper">', unsafe_allow_html=True)

# Active Order Section
st.markdown('<h2 class="section-title">Active Order</h2>', unsafe_allow_html=True)

st.markdown("""
<div class="active-order-card">
    <div class="food-icon">🍔</div>
    <div class="order-status-badge">🚚 On the way</div>
    <div class="order-restaurant">Order from Commons</div>
    <div class="order-title">Cheeseburger & Fries</div>
    <div class="order-details">2 items • Delivery to Sondheim Hall, Room 305</div>
    <div class="order-total">Total: $14.50</div>
</div>
""", unsafe_allow_html=True)

# Track Order Button
col1, col2, col3 = st.columns([1, 1, 1])
with col2:
    st.button("Track Order", use_container_width=True, type="primary")

# Browse Restaurants Section
st.markdown('<h2 class="section-title" style="margin-top: 2rem;">Browse Restaurants</h2>', unsafe_allow_html=True)

restaurants = [
    {"name": "Chick-fil-A", "info": "Chicken • Fast Food • 15-20 min", "icon": "🍗"},
    {"name": "Starbucks", "info": "Coffee • Cafe • 10-15 min", "icon": "☕"},
    {"name": "The Commons", "info": "American • Dining Hall • 20-25 min", "icon": "🍔"},
    {"name": "Einstein Bros Bagels", "info": "Bagels • Breakfast • 10-15 min", "icon": "🥯"},
]

for restaurant in restaurants:
    st.markdown(f"""
    <div class="restaurant-card">
        <div class="restaurant-icon">{restaurant['icon']}</div>
        <div class="restaurant-details">
            <div class="restaurant-name">{restaurant['name']}</div>
            <div class="restaurant-info">{restaurant['info']}</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

st.markdown('</div>', unsafe_allow_html=True)
