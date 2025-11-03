import streamlit as st

st.set_page_config(
    page_title="Campus Eats",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS matching exact Campus Eats design
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    /* Hide sidebar and streamlit elements */
    [data-testid="stSidebar"] {
        display: none;
    }

    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}

    [data-testid="stDecoration"] {
        display: none;
    }

    /* Global styles */
    html, body, [data-testid="stAppViewContainer"] {
        background-color: #f0ece3;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .stApp {
        background-color: #f0ece3;
    }

    /* Reset padding */
    .main .block-container {
        max-width: 100%;
        padding: 0;
        padding-top: 0;
    }

    /* Header */
    .campus-header {
        background-color: #ffffff;
        padding: 1rem 2.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .logo-section {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .logo-icon {
        font-size: 1.75rem;
    }

    .logo-text {
        font-size: 1.375rem;
        font-weight: 700;
        color: #111827;
    }

    .nav-section {
        display: flex;
        align-items: center;
        gap: 2.5rem;
    }

    .nav-links {
        display: flex;
        gap: 2rem;
    }

    .nav-links a {
        color: #374151;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9375rem;
    }

    .nav-right {
        display: flex;
        align-items: center;
        gap: 1.25rem;
    }

    .search-icon-header {
        color: #6b7280;
        cursor: pointer;
    }

    .user-avatar {
        width: 2.25rem;
        height: 2.25rem;
        border-radius: 50%;
        overflow: hidden;
    }

    /* Content area */
    .content-wrapper {
        max-width: 1280px;
        margin: 0 auto;
        padding: 2.5rem 2rem;
    }

    /* Search bar */
    .stTextInput > div > div > input {
        background-color: #ffffff;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        padding: 0.875rem 1rem;
        padding-left: 2.75rem;
        color: #111827;
        font-size: 0.9375rem;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .stTextInput > div > div > input::placeholder {
        color: #9ca3af;
    }

    .stTextInput {
        margin-bottom: 1.75rem;
    }

    /* Category buttons */
    .stButton > button {
        background-color: #e5e7eb;
        color: #374151;
        font-weight: 600;
        border: none;
        border-radius: 1.5rem;
        padding: 0.5rem 1.125rem;
        font-size: 0.875rem;
        transition: all 0.15s;
        height: auto;
        white-space: nowrap;
    }

    .stButton > button:hover {
        background-color: #d1d5db;
    }

    .stButton > button[kind="primary"] {
        background-color: #fbbf24;
        color: #111827;
    }

    .stButton > button[kind="primary"]:hover {
        background-color: #f59e0b;
    }

    /* Restaurant cards */
    .restaurant-card {
        background-color: #ffffff;
        border: 1px solid rgba(229, 231, 235, 0.8);
        border-radius: 0.75rem;
        overflow: hidden;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        transition: all 0.3s;
        margin-bottom: 1.5rem;
        display: flex;
        flex-direction: column;
    }

    .restaurant-card:hover {
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        transform: translateY(-4px);
    }

    .restaurant-image-wrapper {
        position: relative;
        width: 100%;
        padding-top: 56.25%; /* 16:9 Aspect Ratio */
        overflow: hidden;
    }

    .restaurant-image {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        background-color: #ffffff;
        padding: 2rem;
    }

    .image-overlay {
        position: absolute;
        inset: 0;
        background: transparent;
    }

    .card-content {
        padding: 1rem 1.25rem;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
    }

    .restaurant-name {
        font-size: 1.125rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 0.25rem;
    }

    .restaurant-hours {
        font-size: 0.875rem;
        color: #6b7280;
        margin-bottom: 1rem;
        flex-grow: 1;
    }

    /* Order Now button */
    .stButton > button {
        background-color: #f2b90d !important;
        color: #000000 !important;
        font-weight: 700 !important;
        border: none !important;
        border-radius: 0.5rem !important;
        padding: 0.5rem 1rem !important;
        font-size: 0.9375rem !important;
        height: auto !important;
        width: 100% !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        transition: all 0.3s !important;
    }

    .stButton > button:hover {
        background-color: #d9a50c !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
    }

    /* Grid spacing */
    [data-testid="column"] {
        padding: 0 0.75rem;
    }

    [data-testid="column"]:first-child {
        padding-left: 0;
    }

    [data-testid="column"]:last-child {
        padding-right: 0;
    }

    /* Footer */
    .campus-footer {
        text-align: center;
        color: #6b7280;
        font-size: 0.8125rem;
        padding: 2.5rem 0 1.5rem 0;
        margin-top: 1rem;
    }

    .campus-footer a {
        color: #6b7280;
        text-decoration: underline;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
    st.session_state.user_type = None

# Restaurant data with operating hours and images
restaurants = {
    "Chick-fil-A": {
        "hours": "Open · 8 AM - 8 PM",
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Chick-fil-A_Logo.svg/2560px-Chick-fil-A_Logo.svg.png"
    },
    "Starbucks": {
        "hours": "Open · 7 AM - 9 PM",
        "image": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/1200px-Starbucks_Corporation_Logo_2011.svg.png"
    },
    "Dining Hall": {
        "hours": "Open · 7 AM - 10 PM",
        "image": "https://styleguide.umbc.edu/wp-content/uploads/sites/113/2019/01/UMBC-primary-logo-RGB.png"
    },
    "Einstein Bros Bagels": {
        "hours": "Open · 7 AM - 3 PM",
        "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2CVpnPv0cMM34s6fzvCWqF_8d4BzpCdklQA&s"
    },
    "The Commons": {
        "hours": "Open · 11 AM - 11 PM",
        "image": "https://styleguide.umbc.edu/wp-content/uploads/sites/113/2019/01/UMBC-primary-logo-RGB.png"
    },
    "Dunkin Donuts": {
        "hours": "Open · 6 AM - 8 PM",
        "image": "https://1000logos.net/wp-content/uploads/2023/04/Dunkin-Donuts-logo.png"
    }
}

if not st.session_state.logged_in:
    # Landing page styling
    st.markdown("""
    <style>
        /* Override for landing page */
        .main .block-container {
            padding: 3rem 2rem !important;
            max-width: 100% !important;
        }

        .stApp {
            background-color: #f5f5f5;
            background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuBAVLshfkBgcS7nPejNXn5RweAh1AlzmVwL9YB19pwQ-tO4WaVDWvfyiyx7RQU_nKtwnD_gNANcp6_TFuA5f4klNrsJzlI7AH-YMnZIDf146mqzNRK6kcjEB7gN6uVwSxQ4wUzfoKy_3GdLyKIxIkjGBwRJOJu20j9Y8X6kKClcCMXkLKHGqxRPyQn7gPbwhvnpYUhEuYkcQ5A2IEzTsbFtSUDQdr5Bsc9kR8DP3A6_4JG_Hl5g9yNRI-8SbwwHQI8DDpAevU2h4gOC");
            background-size: cover;
            background-position: center;
            background-blend-mode: overlay;
        }

        .landing-logo {
            font-size: 3rem;
            font-weight: 700;
            color: #000000;
            text-align: center;
            margin-bottom: 3rem;
            font-family: 'Work Sans', sans-serif;
        }

        .landing-tagline {
            font-size: 1.25rem;
            color: #000000;
            font-weight: 500;
            text-align: center;
            margin-top: 3rem;
        }

        .role-card-wrapper {
            text-align: center;
            padding: 3rem 2rem 2rem 2rem;
            background: white;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: all 0.3s;
            margin-bottom: 1.5rem;
        }

        /* Style buttons on landing page */
        [data-testid="stVerticalBlock"] [data-testid="stButton"] > button[kind="primary"] {
            background-color: #FFC20E !important;
            color: #000000 !important;
            font-weight: 600 !important;
            border: none !important;
            padding: 0.75rem 2rem !important;
            border-radius: 0.5rem !important;
            width: 100% !important;
            transition: all 0.3s !important;
            margin-top: 0.5rem !important;
        }

        [data-testid="stVerticalBlock"] [data-testid="stButton"] > button[kind="primary"]:hover {
            background-color: #e6af0d !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.15) !important;
        }

        .role-card-icon {
            font-size: 4.5rem;
            margin-bottom: 1rem;
        }

        .role-card-title {
            font-size: 1.875rem;
            font-weight: 700;
            color: #000000;
            margin-bottom: 0.5rem;
        }

        .role-card-description {
            color: #6b7280;
            font-size: 1rem;
        }

        /* Center content */
        [data-testid="column"] {
            display: flex;
            justify-content: center;
        }
    </style>
    """, unsafe_allow_html=True)

    # Logo
    st.markdown('<h1 class="landing-logo">DormDash</h1>', unsafe_allow_html=True)

    # Create spacing
    st.markdown("<div style='height: 2rem;'></div>", unsafe_allow_html=True)

    # Role cards
    col1, col2, col3 = st.columns([1, 2, 1])

    with col2:
        cols = st.columns(2, gap="large")

        # Customer card - Use container with button
        with cols[0]:
            customer_container = st.container()
            with customer_container:
                st.markdown("""
                <div class='role-card-wrapper'>
                    <div class='role-card-icon'>🛍️</div>
                    <h2 class='role-card-title'>I'm a Customer</h2>
                    <p class='role-card-description'>Order food from your favorite campus spots.</p>
                </div>
                """, unsafe_allow_html=True)

                if st.button("Click to Continue as Customer", key="customer_login", use_container_width=True, type="primary"):
                    st.switch_page("pages/user.py")

        # Worker card - Use container with button
        with cols[1]:
            worker_container = st.container()
            with worker_container:
                st.markdown("""
                <div class='role-card-wrapper'>
                    <div class='role-card-icon'>🛵</div>
                    <h2 class='role-card-title'>I'm a Worker</h2>
                    <p class='role-card-description'>Earn money by delivering food on campus to memebers on campus.</p>
                </div>
                """, unsafe_allow_html=True)

                if st.button("Click to Continue as Worker", key="worker_login", use_container_width=True, type="primary"):
                    st.switch_page("pages/worker.py")

    # Tagline
    st.markdown('<p class="landing-tagline">Your campus cravings, delivered.</p>', unsafe_allow_html=True)
else:
    # Header
    st.markdown("""
    <div class="campus-header">
        <div class="logo-section">
            <span class="logo-icon">🎓</span>
            <span class="logo-text">Campus Eats</span>
        </div>
        <div class="nav-section">
            <div class="nav-links">
                <a href="#">Home</a>
                <a href="#">Orders</a>
                <a href="#">Account</a>
            </div>
            <div class="nav-right">
                <svg class="search-icon-header" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <div class="user-avatar">
                    <img src="" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Content wrapper
    st.markdown('<div class="content-wrapper">', unsafe_allow_html=True)

    # Search bar with icon
    st.markdown("""
    <div style="position: relative;">
        <svg style="position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); z-index: 10; pointer-events: none;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
        </svg>
    </div>
    """, unsafe_allow_html=True)
    search = st.text_input("", placeholder="Search for food or venues...", label_visibility="collapsed", key="search_bar")

    # Category filter buttons
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.button("All", use_container_width=True, type="primary", key="filter_all")
    with col2:
        st.button("Dining Hall", use_container_width=True, key="filter_dining")
    with col3:
        st.button("Café", use_container_width=True, key="filter_cafe")
    with col4:
        st.button("Quick Bites", use_container_width=True, key="filter_quick")

    st.markdown("<div style='height: 2.5rem;'></div>", unsafe_allow_html=True)

    # Restaurant cards in 3-column grid
    restaurant_list = list(restaurants.items())

    # Row 1: First 3 restaurants
    cols = st.columns(3, gap="medium")
    for idx, (name, info) in enumerate(restaurant_list[:3]):
        with cols[idx]:
            st.markdown(f"""
            <div class="restaurant-card">
                <div class="restaurant-image-wrapper">
                    <div class="restaurant-image" style="background-image: url('{info['image']}');"></div>
                    <div class="image-overlay"></div>
                </div>
                <div class="card-content">
                    <div class="restaurant-name">{name}</div>
                    <div class="restaurant-hours">{info['hours']}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            if st.button("Order Now", key=f"order_{idx}", use_container_width=True):
                st.success(f"Opening menu for {name}...")
                # Here you can add navigation to restaurant menu page
                # st.session_state.selected_restaurant = name
                # st.switch_page("pages/restaurant_menu.py")

    # Row 2: Next 3 restaurants
    cols = st.columns(3, gap="medium")
    for idx, (name, info) in enumerate(restaurant_list[3:], start=3):
        with cols[idx - 3]:
            st.markdown(f"""
            <div class="restaurant-card">
                <div class="restaurant-image-wrapper">
                    <div class="restaurant-image" style="background-image: url('{info['image']}');"></div>
                    <div class="image-overlay"></div>
                </div>
                <div class="card-content">
                    <div class="restaurant-name">{name}</div>
                    <div class="restaurant-hours">{info['hours']}</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
            if st.button("Order Now", key=f"order_{idx}", use_container_width=True):
                st.success(f"Opening menu for {name}...")
                # Here you can add navigation to restaurant menu page
                # st.session_state.selected_restaurant = name
                # st.switch_page("pages/restaurant_menu.py")

    st.markdown('</div>', unsafe_allow_html=True)

    # Footer
    st.markdown("""
    <div class="campus-footer">
        © 2024 Campus Eats. All Rights Reserved.<br>
        Part of the UMBC Dining Experience.
    </div>
    """, unsafe_allow_html=True)

