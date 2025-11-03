import streamlit as st

st.set_page_config(
    page_title="DormDash - User Login",
    page_icon="🍕",
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
        color: #6b7280;
        margin-bottom: 2rem;
        font-size: 0.95rem;
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
        color: #6b7280;
        font-size: 0.875rem;
    }
    
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
</style>
""", unsafe_allow_html=True)

# Logo placeholder 
st.markdown("<div style='text-align: center; margin-bottom: 1rem;'>🍔</div>", unsafe_allow_html=True)

st.markdown("# DormDash")
st.markdown('<p class="subtitle">Welcome back! Please login to your account.</p>', unsafe_allow_html=True)

with st.form("login_form", clear_on_submit=False):
    email = st.text_input("Email or Username", placeholder="you@umbc.edu", key="user_email")
    password = st.text_input("Password", type="password", placeholder="••••••••", key="user_password")
    
    st.markdown('<div class="forgot-password"><a href="#">Forgot Password?</a></div>', unsafe_allow_html=True)
    
    submit = st.form_submit_button("Login", use_container_width=True)
    
    if submit:
        if email == "login" and password == "login":
            st.session_state.logged_in = True
            st.session_state.user_type = "user"
            st.session_state.username = email
            st.success("Login successful!")
            st.switch_page("app.py")
        elif email and password:
            st.error("Invalid credentials. Use 'login' for both username and password.")
        else:
            st.error("Please enter both email and password")

st.markdown("""
    <div class="signup-text">
        Don't have an account? <a href="#">Sign up</a>
    </div>
""", unsafe_allow_html=True)

