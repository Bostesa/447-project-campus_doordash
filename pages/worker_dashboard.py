import streamlit as st

# Check if worker is logged in
if 'logged_in' not in st.session_state or not st.session_state.logged_in or st.session_state.user_type != "worker":
    st.switch_page("pages/worker.py")

st.set_page_config(
    page_title="DormDash - Worker Dashboard",
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

    /* Active Delivery Card */
    .active-delivery {
        background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
        border-radius: 1rem;
        padding: 1.5rem;
        margin-bottom: 1rem;
        position: relative;
        min-height: 180px;
        display: flex;
        flex-direction: column;
    }

    /* Style the element that comes after our blue div to connect seamlessly */
    div[style*="background: linear-gradient(135deg, #dbeafe"] + div {
        background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
        padding: 0 1.5rem 1.5rem 1.5rem;
        margin-top: 0 !important;
        border-radius: 0 0 1rem 1rem;
        margin-bottom: 1rem !important;
    }

    /* Remove extra margin from the text input */
    div[style*="background: linear-gradient(135deg, #dbeafe"] + div .stTextInput {
        margin-top: 0 !important;
        margin-bottom: 0 !important;
    }

    .order-from {
        color: #007AFF;
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
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 1rem;
    }

    .order-pay {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #000000;
        font-weight: 600;
        margin-bottom: 1.5rem;
    }

    .food-icon {
        position: absolute;
        right: 2rem;
        top: 2rem;
        font-size: 4rem;
    }

    /* Status buttons */
    .stButton > button {
        font-weight: 700;
        border-radius: 0.5rem;
        padding: 0.875rem 1.5rem;
        border: none;
        transition: all 0.2s;
        min-height: 50px;
    }

    button[kind="primary"] {
        background-color: #007AFF !important;
        color: white !important;
    }

    button[kind="secondary"] {
        background-color: white !important;
        color: #000000 !important;
        border: 1px solid #e5e7eb !important;
    }

    /* Available Jobs */
    .section-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #000000;
        margin-bottom: 1.5rem;
    }

    .job-card {
        background: white;
        border-radius: 0.75rem;
        padding: 1.25rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .job-icon {
        width: 80px;
        height: 80px;
        border-radius: 0.5rem;
        background: #fef3c7;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5rem;
    }

    .job-icon.coffee {
        background: #fef3c7;
    }

    .job-icon.bistro {
        background: #fce7f3;
    }

    .job-details {
        flex: 1;
    }

    .job-from {
        color: #6b7280;
        font-size: 0.875rem;
    }

    .job-title {
        font-size: 1.125rem;
        font-weight: 700;
        color: #000000;
        margin: 0.25rem 0;
    }

    .job-location {
        color: #6b7280;
        font-size: 0.875rem;
    }

    .job-price {
        color: #007AFF;
        font-size: 1.25rem;
        font-weight: 700;
        margin-right: 1rem;
    }

    .accept-btn {
        background-color: #007AFF !important;
        color: white !important;
    }

    /* Confirm Delivery Panel */
    .confirm-title {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
        color: #000000;
    }

    .confirm-description {
        color: #6b7280;
        margin-bottom: 1.5rem;
        font-size: 0.95rem;
        line-height: 1.5;
    }

    .stTextInput > div > div > input {
        text-align: center;
        font-size: 1.25rem;
        letter-spacing: 0.5rem;
        padding: 1rem;
        border: 2px solid #e5e7eb;
        background-color: #ffffff;
        border-radius: 0.5rem;
    }

    .or-divider {
        text-align: center;
        color: #9ca3af;
        margin: 1.5rem 0;
        font-weight: 500;
        font-size: 0.95rem;
    }
</style>
""", unsafe_allow_html=True)

# Header
st.markdown("""
<div class="worker-header">
    <div class="header-logo">
        <div class="logo-icon">🚗</div>
        <div class="logo-text">DormDash</div>
    </div>
    <div class="header-nav">
        <a href="#" class="nav-link active">Jobs</a>
        <a href="#" class="nav-link">Earnings</a>
        <a href="#" class="nav-link">Account</a>
        <div class="user-avatar"></div>
    </div>
</div>
""", unsafe_allow_html=True)

# Content
st.markdown('<div class="content-wrapper">', unsafe_allow_html=True)

# Active Delivery Section
st.markdown('<h2 class="section-title">Active Delivery</h2>', unsafe_allow_html=True)

col1, col2 = st.columns([1.5, 1])

with col1:
    st.markdown("""
    <div class="active-delivery">
        <div class="food-icon">🍔</div>
        <div class="order-from">Order from Commons</div>
        <div class="order-title">Cheeseburger & Fries</div>
        <div class="order-details">2 items • Drop-off at Sondheim Hall</div>
        <div class="order-pay">💵 $9.50 Est. Pay</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    # Use a container to group the elements
    with st.container():
        st.markdown("""
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); 
                        border-radius: 1rem; 
                        padding: 1.5rem 1.5rem 0.5rem 1.5rem; 
                        min-height: 140px;
                        margin-bottom: 0rem;">
                <div class="confirm-title">Confirm Delivery</div>
                <div class="confirm-description">Enter PIN or scan QR code to complete the order.</div>
                <div style="margin-bottom: 0.5rem; margin-top: 0.75rem;">
                    <label style="color: #6b7280; font-size: 0.875rem; font-weight: 500;">Customer PIN</label>
                </div>
            </div>
        """, unsafe_allow_html=True)
        
        pin = st.text_input("", placeholder="– – – –", label_visibility="collapsed", key="pin_input", max_chars=4)

# Second row with buttons
col1_b, col2_b = st.columns([1.5, 1])

with col1_b:
    # Status buttons
    cols = st.columns(2)
    with cols[0]:
        st.button("🚚 Picked Up", key="picked_up", use_container_width=True, type="primary")
    with cols[1]:
        st.button("✓ Delivered", key="delivered", use_container_width=True, type="secondary")

with col2_b:
    st.button("🔲 Scan QR Code", use_container_width=True, type="primary")

# Available Jobs Section
st.markdown('<h2 class="section-title" style="margin-top: 2rem;">Available Jobs</h2>', unsafe_allow_html=True)

# Job 1
st.markdown("""
<div class="job-card">
    <div class="job-icon">🍔</div>
    <div class="job-details">
        <div class="job-from">Order from Chick fil A</div>
        <div class="job-title">Spicy chicken sandwich meal</div>
        <div class="job-location">2 items • Drop-off at Chesapeake hall</div>
    </div>
    <div class="job-price">$4.75</div>
</div>
""", unsafe_allow_html=True)
st.button("Accept →", key="accept_1", use_container_width=False)

# Job 2
st.markdown("""
<div class="job-card">
    <div class="job-icon coffee">☕</div>
    <div class="job-details">
        <div class="job-from">Order from Starbucks</div>
        <div class="job-title">Coffee & Pastries</div>
        <div class="job-location">3 items • Drop-off at ITE</div>
    </div>
    <div class="job-price">$6.25</div>
</div>
""", unsafe_allow_html=True)
st.button("Accept →", key="accept_2", use_container_width=False)

# Job 3
st.markdown("""
<div class="job-card">
    <div class="job-icon bistro">🥗</div>
    <div class="job-details">
        <div class="job-from">Order from The Commons</div>
        <div class="job-title"> Chipotle Bowl</div>
        <div class="job-location">1 item • Drop-off at Library</div>
    </div>
    <div class="job-price">$4.00</div>
</div>
""", unsafe_allow_html=True)
st.button("Accept →", key="accept_3", use_container_width=False)

st.markdown('</div>', unsafe_allow_html=True)