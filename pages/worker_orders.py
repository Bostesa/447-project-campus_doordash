import streamlit as st

# Check if worker is logged in
if 'logged_in' not in st.session_state or not st.session_state.logged_in or st.session_state.user_type != "worker":
    st.switch_page("pages/worker.py")

st.set_page_config(
    page_title="DormDash - Orders",
    page_icon="🚗",
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
    .worker-header {
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
        background-color: #007AFF;
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

    .header-nav {
        display: flex;
        gap: 2rem;
        align-items: center;
    }

    .nav-link {
        color: #000000;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
    }

    .nav-link.active {
        color: #007AFF;
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

    /* Order Card */
    .order-card {
        background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
        border-radius: 1rem;
        padding: 1.5rem;
        margin-bottom: 1rem;
        position: relative;
    }

    .order-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
    }

    .order-date {
        color: #6b7280;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .order-status {
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.875rem;
        font-weight: 600;
    }

    .status-completed {
        background-color: #d1fae5;
        color: #065f46;
    }

    .status-cancelled {
        background-color: #fee2e2;
        color: #991b1b;
    }

    .order-from {
        color: #007AFF;
        font-weight: 600;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .order-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #000000;
        margin-bottom: 0.5rem;
    }

    .order-details {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }

    .order-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-top: 1px solid rgba(0,0,0,0.1);
        padding-top: 1rem;
    }

    .order-earnings {
        color: #000000;
        font-weight: 700;
        font-size: 1rem;
    }

    .food-icon {
        position: absolute;
        right: 2rem;
        top: 2rem;
        font-size: 3rem;
    }

    /* Stats Cards */
    .stats-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }

    .stat-card {
        background: white;
        border-radius: 0.75rem;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .stat-label {
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }

    .stat-value {
        font-size: 1.875rem;
        font-weight: 700;
        color: #000000;
    }

    .stat-value.earnings {
        color: #007AFF;
    }
</style>
""", unsafe_allow_html=True)

# Header with navigation
col1, col2, col3 = st.columns([0.3, 1.4, 0.3])

with col1:
    if st.button("← Jobs", key="nav_jobs", use_container_width=True):
        st.switch_page("pages/worker_dashboard.py")

with col2:
    st.markdown("""
    <div class="worker-header" style="padding: 0.5rem 0;">
        <div class="header-logo" style="margin: 0 auto;">
            <div class="logo-icon">🚗</div>
            <div class="logo-text">DormDash</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown('<div style="height: 40px;"></div>', unsafe_allow_html=True)

# Content
st.markdown('<div class="content-wrapper">', unsafe_allow_html=True)

st.markdown('<h2 class="section-title">Your Orders</h2>', unsafe_allow_html=True)

# Stats Cards
st.markdown("""
<div class="stats-container">
    <div class="stat-card">
        <div class="stat-label">Today's Deliveries</div>
        <div class="stat-value">8</div>
    </div>
    <div class="stat-card">
        <div class="stat-label">This Week</div>
        <div class="stat-value">42</div>
    </div>
    <div class="stat-card">
        <div class="stat-label">Total Earnings</div>
        <div class="stat-value earnings">$387.50</div>
    </div>
</div>
""", unsafe_allow_html=True)

st.markdown('<h3 class="section-title" style="font-size: 1.25rem; margin-top: 2rem;">Recent Orders</h3>', unsafe_allow_html=True)

# Order History
orders = [
    {
        "date": "Today, 2:45 PM",
        "restaurant": "Commons",
        "title": "Cheeseburger & Fries",
        "details": "2 items • Delivered to Sondheim Hall",
        "earnings": "$9.50",
        "status": "completed",
        "icon": "🍔"
    },
    {
        "date": "Today, 1:30 PM",
        "restaurant": "Chick fil A",
        "title": "Spicy chicken sandwich meal",
        "details": "2 items • Delivered to Chesapeake Hall",
        "earnings": "$4.75",
        "status": "completed",
        "icon": "🍔"
    },
    {
        "date": "Today, 12:15 PM",
        "restaurant": "Starbucks",
        "title": "Coffee & Pastries",
        "details": "3 items • Delivered to ITE",
        "earnings": "$6.25",
        "status": "completed",
        "icon": "☕"
    },
    {
        "date": "Today, 11:00 AM",
        "restaurant": "The Commons",
        "title": "Chipotle Bowl",
        "details": "1 item • Delivered to Library",
        "earnings": "$4.00",
        "status": "completed",
        "icon": "🥗"
    },
    {
        "date": "Yesterday, 6:45 PM",
        "restaurant": "Einstein Bros",
        "title": "Bagel Sandwich",
        "details": "1 item • Cancelled",
        "earnings": "$0.00",
        "status": "cancelled",
        "icon": "🥯"
    }
]

for order in orders:
    status_class = f"status-{order['status']}"
    status_text = order['status'].capitalize()

    st.markdown(f"""
    <div class="order-card">
        <div class="food-icon">{order['icon']}</div>
        <div class="order-header">
            <div class="order-date">{order['date']}</div>
            <div class="order-status {status_class}">{status_text}</div>
        </div>
        <div class="order-from">Order from {order['restaurant']}</div>
        <div class="order-title">{order['title']}</div>
        <div class="order-details">{order['details']}</div>
        <div class="order-footer">
            <div class="order-earnings">Earned: {order['earnings']}</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

st.markdown('</div>', unsafe_allow_html=True)
