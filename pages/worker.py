import streamlit as st

st.set_page_config(
    page_title="DormDash - Worker Login",
    page_icon="🚗",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# Hide sidebar and add custom CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;700&display=swap');
    
    [data-testid="stSidebar"] {
        display: none;
    }
    
    * {
        font-family: 'Work Sans', sans-serif;
    }
    
    .stApp {
        background-color: #f8f8f5;
    }
    
    .main .block-container {
        max-width: 450px;
        padding-top: 3rem;
    }
    
    h1 {
        color: #221e10;
        text-align: center;
        font-weight: 700;
        font-size: 2.5rem;
        margin-bottom: 0.5rem;
    }
    
    .subtitle {
        text-align: center;
        color: #9e9e9e;
        margin-bottom: 2rem;
        font-size: 0.95rem;
    }
    
    /* Pac-man logo */
    .logo-container {
        display: flex;
        justify-content: center;
        margin-bottom: 1.5rem;
    }
    
    .logo-circle {
        width: 80px;
        height: 80px;
        background-color: #f2b90d;
        border-radius: 50%;
        position: relative;
        overflow: hidden;
    }
    
    .logo-circle::before {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-left: 40px solid #f8f8f5;
        border-top: 20px solid transparent;
        border-bottom: 20px solid transparent;
        right: 0;
        top: 20px;
    }
    
    .logo-circle::after {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border-right: 40px solid #f8f8f5;
        border-top: 20px solid transparent;
        border-bottom: 20px solid transparent;
        bottom: 0;
        left: 0;
    }
    
    /* Form container */
    .stForm {
        background-color: rgba(255, 255, 255, 0.6);
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    }
    
    /* Input styling */
    .stTextInput > div > div > input {
        background-color: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 0.875rem;
        color: #221e10;
        font-size: 0.95rem;
    }
    
    .stTextInput > label {
        color: #374151;
        font-weight: 500;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
    }
    
    /* Button styling */
    .stButton > button {
        background-color: #f2b90d;
        color: #221e10;
        font-weight: 700;
        border: none;
        border-radius: 0.5rem;
        padding: 0.875rem;
        width: 100%;
        font-size: 1rem;
        margin-top: 0.5rem;
    }
    
    .stButton > button:hover {
        background-color: #d9a50c;
    }
    
    /* Link styling */
    a {
        color: #f2b90d;
        text-decoration: none;
        font-weight: 500;
    }
    
    a:hover {
        text-decoration: underline;
    }
    
    .forgot-password {
        text-align: right;
        font-size: 0.875rem;
        margin-top: -0.5rem;
        margin-bottom: 1rem;
    }
    
    .signup-text {
        text-align: center;
        margin-top: 2rem;
        color: #9e9e9e;
        font-size: 0.875rem;
    }
    
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
</style>
""", unsafe_allow_html=True)

# Pac-man style logo
st.markdown("""
    <div class="logo-container">
        <div class="logo-circle"></div>
    </div>
""", unsafe_allow_html=True)

st.markdown("# Dasher Login")
st.markdown('<p class="subtitle">Welcome back, let\'s get you on the road.</p>', unsafe_allow_html=True)

with st.form("worker_login_form", clear_on_submit=False):
    email = st.text_input("Email or username", placeholder="you@campus.edu", key="worker_email")
    password = st.text_input("Password", type="password", placeholder="••••••••", key="worker_password")
    
    st.markdown('<div class="forgot-password"><a href="#">Forgot password?</a></div>', unsafe_allow_html=True)
    
    submit = st.form_submit_button("Login", use_container_width=True)
    
    if submit:
        if email and password:
            st.session_state.logged_in = True
            st.session_state.user_type = "worker"
            st.session_state.username = email
            st.success("Login successful!")
            st.switch_page("app.py")
        else:
            st.error("Please enter both email and password")

st.markdown("""
    <div class="signup-text">
        New to the crew? <a href="#" style="font-weight: 700;">Sign up here</a>
    </div>
""", unsafe_allow_html=True)