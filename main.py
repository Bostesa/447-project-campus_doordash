import streamlit as st

# diners = ["True Grits", "Copperhead Jacks", "Halal Shack", "Chik Fil A"]
menu = {"True Grits":
        ["Breakfast", "Lunch", "Dinner"],
        "Copperhead Jacks":
        ["Tacos", "Burrito", "Quesadilla"],
        "Halal Shack":
        ["Rice Bowl", "French Fry Bowl", "Naanarito"],
        "Chik Fil A":
        ["10-Piece Nugget", "Spicy Chicken Sandwich", "Cobb Salad"]}


st.title("DormDash")
st.write("Food from across campus")

item = None
diner = st.selectbox("Location", options=menu.keys(), index=None)

if diner:
    item = st.selectbox("Menu Item", options=menu[diner], index=None)

if st.button("Order", disabled=item is None):
    st.write("Order placed")