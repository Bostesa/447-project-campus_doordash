import streamlit as st

st.set_page_config(
    page_title="DormDash",
    page_icon="🍔",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# Hide sidebar completely
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;700&display=swap');
    
    /* Hide sidebar */
    [data-testid="stSidebar"] {
        display: none;
    }
    
    /* Global styles */
    * {
        font-family: 'Work Sans', sans-serif;
    }
    
    .stApp {
        background-color: #f8f8f5;
    }
    
    /* Center content */
    .main .block-container {
        max-width: 500px;
        padding-top: 5rem;
    }
    
    /* Title styling */
    h1 {
        color: #221e10;
        font-weight: 700;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    
    /* Subtitle */
    .subtitle {
        text-align: center;
        color: #6b7280;
        margin-bottom: 2rem;
        font-size: 1rem;
    }
    
    /* Warning box styling */
    .stAlert {
        background-color: #fef3c7;
        color: #92400e;
        border: 1px solid #fde68a;
        border-radius: 0.5rem;
        padding: 1rem;
        text-align: center;
    }
    
    /* Button styling */
    .stButton > button {
        background-color: #f2b90d;
        color: #221e10;
        font-weight: 700;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 1.5rem;
        width: 100%;
        font-size: 1rem;
        transition: all 0.3s;
        height: 3rem;
    }
    
    .stButton > button:hover {
        background-color: #d9a50c;
        border: none;
    }
    
    /* Input styling */
    .stTextInput > div > div > input,
    .stSelectbox > div > div > div {
        background-color: #ffffff;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        padding: 0.75rem;
        color: #221e10;
        font-size: 1rem;
    }
    
    .stTextInput > label,
    .stSelectbox > label {
        color: #374151;
        font-weight: 500;
        font-size: 0.875rem;
    }
    
    /* Success message */
    .stSuccess {
        background-color: #d1fae5;
        color: #065f46;
        border-radius: 0.5rem;
    }
    
    /* Hide streamlit branding */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    
    /* Login buttons container */
    .login-buttons {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }
</style>
""", unsafe_allow_html=True)

st.markdown("# 🍔 DormDash")
st.markdown('<p class="subtitle">Food from across campus</p>', unsafe_allow_html=True)

menu = {
    "True Grits": ["Breakfast", "Lunch", "Dinner"],
    "Copperhead Jacks": ["Tacos", "Burrito", "Quesadilla"],
    "Halal Shack": ["Rice Bowl", "French Fry Bowl", "Naanarito"],
    "Chik Fil A": ["10-Piece Nugget", "Spicy Chicken Sandwich", "Cobb Salad"]
}

# Initialize session state
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
    st.session_state.user_type = None

if not st.session_state.logged_in:
    st.warning("Please login to place an order")
    
    col1, col2 = st.columns(2)
    with col1:
        if st.button("👤 User Login", use_container_width=True):
            st.switch_page("pages/user.py")
    with col2:
        if st.button("🚗 Worker Login", use_container_width=True):
            st.switch_page("pages/worker.py")
else:
    st.success(f"Welcome back, {st.session_state.get('username', 'User')}!")
    
    item = None
    diner = st.selectbox("Location", options=menu.keys(), index=None, placeholder="Choose a location")
    if diner:
        item = st.selectbox("Menu Item", options=menu[diner], index=None, placeholder="Choose an item")
    
    col1, col2 = st.columns([3, 1])
    with col1:
        if st.button("Order", disabled=item is None, use_container_width=True):
            st.success("Order placed successfully!")
    with col2:
        if st.button("Logout", use_container_width=True):
            st.session_state.logged_in = False
            st.session_state.user_type = None
            st.rerun()

