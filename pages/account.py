import streamlit as st

# Check if user is logged in
if 'logged_in' not in st.session_state or not st.session_state.logged_in:
    st.switch_page("app.py")

# Determine user type
is_worker = st.session_state.user_type == "worker"
is_customer = st.session_state.user_type == "customer"

st.set_page_config(
    page_title="DormDash - Account",
    page_icon="🚗" if is_worker else "🎓",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Color schemes based on user type
if is_worker:
    primary_color = "#007AFF"
    secondary_color = "#dbeafe"
    gradient_start = "#dbeafe"
    gradient_end = "#e0e7ff"
    logo_icon = "🚗"
    back_page = "pages/worker_dashboard.py"
else:
    primary_color = "#f2b90d"
    secondary_color = "#fef3c7"
    gradient_start = "#fef3c7"
    gradient_end = "#fde68a"
    logo_icon = "🎓"
    back_page = "app.py"

# Custom CSS
st.markdown(f"""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&display=swap');

    /* Hide sidebar */
    [data-testid="stSidebar"] {{
        display: none;
    }}

    #MainMenu {{visibility: hidden;}}
    footer {{visibility: hidden;}}
    header {{visibility: hidden;}}

    /* Global styles */
    * {{
        font-family: 'Work Sans', sans-serif;
    }}

    .stApp {{
        background-color: #f8f8f5;
    }}

    .main .block-container {{
        padding: 0;
        max-width: 100%;
    }}

    /* Header */
    .account-header {{
        background-color: #ffffff;
        padding: 1rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }}

    .header-logo {{
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }}

    .logo-icon {{
        width: 40px;
        height: 40px;
        background-color: {primary_color};
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.25rem;
        font-weight: 700;
    }}

    .logo-text {{
        font-size: 1.25rem;
        font-weight: 700;
        color: #000000;
    }}

    .user-avatar {{
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f59e0b, #ef4444);
    }}

    /* Content */
    .content-wrapper {{
        max-width: 900px;
        margin: 0 auto;
        padding: 2rem;
    }}

    .section-title {{
        font-size: 1.5rem;
        font-weight: 700;
        color: #000000;
        margin-bottom: 1.5rem;
    }}

    /* Profile Card */
    .profile-card {{
        background: linear-gradient(135deg, {gradient_start} 0%, {gradient_end} 100%);
        border-radius: 1rem;
        padding: 2rem;
        margin-bottom: 2rem;
        display: flex;
        align-items: center;
        gap: 2rem;
    }}

    .profile-avatar {{
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f59e0b, #ef4444);
    }}

    .profile-info {{
        flex: 1;
    }}

    .profile-name {{
        font-size: 1.75rem;
        font-weight: 700;
        color: #000000;
        margin-bottom: 0.5rem;
    }}

    .profile-email {{
        color: #6b7280;
        font-size: 1rem;
        margin-bottom: 0.25rem;
    }}

    .profile-role {{
        color: #6b7280;
        font-size: 0.875rem;
    }}

    /* Settings Card */
    .settings-card {{
        background: white;
        border-radius: 1rem;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }}

    .settings-section {{
        margin-bottom: 1.5rem;
    }}

    .settings-label {{
        font-weight: 600;
        color: #000000;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
    }}

    .settings-value {{
        color: #6b7280;
        font-size: 0.95rem;
    }}

    /* Input fields */
    .stTextInput > div > div > input {{
        background-color: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.75rem;
    }}

    .stTextInput > label {{
        font-weight: 600;
        color: #000000;
        font-size: 0.875rem;
    }}

    /* Buttons */
    .stButton > button[kind="primary"] {{
        background-color: {primary_color} !important;
        color: {"white" if is_worker else "#000000"} !important;
        font-weight: 700 !important;
        border-radius: 0.5rem !important;
        padding: 0.75rem 2rem !important;
    }}

    .stButton > button[kind="secondary"] {{
        background-color: #f3f4f6 !important;
        color: #000000 !important;
        font-weight: 600 !important;
        border-radius: 0.5rem !important;
        padding: 0.75rem 2rem !important;
    }}

    /* Stats */
    .stats-grid {{
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }}

    .stat-box {{
        background: white;
        border-radius: 0.75rem;
        padding: 1.25rem;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }}

    .stat-label {{
        color: #6b7280;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }}

    .stat-value {{
        font-size: 1.5rem;
        font-weight: 700;
        color: {primary_color};
    }}
</style>
""", unsafe_allow_html=True)

# Header with navigation
col1, col2, col3 = st.columns([0.3, 1.4, 0.3])

with col1:
    if st.button("← Back", key="nav_back", use_container_width=True):
        st.switch_page(back_page)

with col2:
    st.markdown(f"""
    <div class="account-header" style="padding: 0.5rem 0;">
        <div class="header-logo" style="margin: 0 auto;">
            <div class="logo-icon">{logo_icon}</div>
            <div class="logo-text">DormDash</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown('<div style="height: 40px;"></div>', unsafe_allow_html=True)

# Content
st.markdown('<div class="content-wrapper">', unsafe_allow_html=True)

st.markdown('<h2 class="section-title">Account Settings</h2>', unsafe_allow_html=True)

# Profile Card
username = st.session_state.get('username', 'User')
st.markdown(f"""
<div class="profile-card">
    <div class="profile-avatar"></div>
    <div class="profile-info">
        <div class="profile-name">{username.capitalize()}</div>
        <div class="profile-email">{username}@umbc.edu</div>
        <div class="profile-role">{"Delivery Driver" if is_worker else "Customer"}</div>
    </div>
</div>
""", unsafe_allow_html=True)

# Statistics (Worker specific)
if is_worker:
    st.markdown("""
    <div class="stats-grid">
        <div class="stat-box">
            <div class="stat-label">Total Deliveries</div>
            <div class="stat-value">42</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Total Earnings</div>
            <div class="stat-value">$387.50</div>
        </div>
    </div>
    """, unsafe_allow_html=True)
else:
    st.markdown("""
    <div class="stats-grid">
        <div class="stat-box">
            <div class="stat-label">Total Orders</div>
            <div class="stat-value">24</div>
        </div>
        <div class="stat-box">
            <div class="stat-label">Total Spent</div>
            <div class="stat-value">$287.50</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

# Personal Information Section
st.markdown('<div class="settings-card">', unsafe_allow_html=True)
st.markdown("### Personal Information")

col1, col2 = st.columns(2)
with col1:
    st.text_input("First Name", value="John", key="first_name")
    st.text_input("Email", value=f"{username}@umbc.edu", key="email")
with col2:
    st.text_input("Last Name", value="Doe", key="last_name")
    st.text_input("Phone", value="+1 (410) 555-1234", key="phone")

st.markdown('</div>', unsafe_allow_html=True)

# Delivery Address (Customer specific)
if is_customer:
    st.markdown('<div class="settings-card">', unsafe_allow_html=True)
    st.markdown("### Delivery Address")

    st.text_input("Building", value="Sondheim Hall", key="building")
    col1, col2 = st.columns(2)
    with col1:
        st.text_input("Room Number", value="305", key="room")
    with col2:
        st.text_input("Floor", value="3", key="floor")

    st.text_input("Special Instructions", value="Leave at door", key="instructions")

    st.markdown('</div>', unsafe_allow_html=True)

# Payment Method (Customer specific)
if is_customer:
    st.markdown('<div class="settings-card">', unsafe_allow_html=True)
    st.markdown("### Payment Method")

    st.radio("Payment Type", ["Credit Card", "Campus Card", "PayPal"], key="payment_type", horizontal=True)

    col1, col2 = st.columns(2)
    with col1:
        st.text_input("Card Number", value="•••• •••• •••• 1234", type="password", key="card_number")
    with col2:
        st.text_input("CVV", value="•••", type="password", key="cvv")

    col1, col2 = st.columns(2)
    with col1:
        st.text_input("Expiry Date", value="12/25", key="expiry")
    with col2:
        st.text_input("ZIP Code", value="21250", key="zip")

    st.markdown('</div>', unsafe_allow_html=True)

# Vehicle Information (Worker specific)
if is_worker:
    st.markdown('<div class="settings-card">', unsafe_allow_html=True)
    st.markdown("### Vehicle Information")

    col1, col2 = st.columns(2)
    with col1:
        st.selectbox("Vehicle Type", ["Car", "Bike", "Scooter", "Walking"], key="vehicle_type")
        st.text_input("Make & Model", value="Honda Civic", key="vehicle_model")
    with col2:
        st.text_input("License Plate", value="ABC1234", key="license_plate")
        st.text_input("Color", value="Silver", key="vehicle_color")

    st.markdown('</div>', unsafe_allow_html=True)

# Notifications
st.markdown('<div class="settings-card">', unsafe_allow_html=True)
st.markdown("### Notifications")

st.checkbox("Email notifications", value=True, key="email_notif")
st.checkbox("SMS notifications", value=True, key="sms_notif")
st.checkbox("Push notifications", value=True, key="push_notif")

if is_worker:
    st.checkbox("New order alerts", value=True, key="order_alerts")
else:
    st.checkbox("Order status updates", value=True, key="status_updates")

st.markdown('</div>', unsafe_allow_html=True)

# Action Buttons
st.markdown("<div style='margin-top: 2rem;'></div>", unsafe_allow_html=True)

col1, col2, col3 = st.columns([1, 1, 1])

with col1:
    if st.button("Save Changes", type="primary", use_container_width=True):
        st.success("Settings saved successfully!")

with col2:
    if st.button("Cancel", type="secondary", use_container_width=True):
        st.switch_page(back_page)

with col3:
    if st.button("Logout", type="secondary", use_container_width=True):
        st.session_state.logged_in = False
        st.session_state.user_type = None
        st.switch_page("app.py")

st.markdown('</div>', unsafe_allow_html=True)
