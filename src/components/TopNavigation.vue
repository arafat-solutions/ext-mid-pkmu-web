<template>
    <div class="top-nav-bar">
      <div class="user-info">
        <img src="" alt="User Avatar" class="avatar" />
        <span class="user-name">Andi Wijaya</span>
        <div class="dropdown">
          <button class="dropbtn">▼</button>
          <div class="dropdown-content">
            <a href="/profile">
              <img src="" alt="Profile" class="icon" />
              Profil Saya
            </a>
            <a href="#">
              <img src="" alt="Logout" class="icon" />
              Log Out
            </a>
          </div>
        </div>
      </div>
      <button class="extra-button">Siap Memulai Tes</button>
    </div>
  </template>
  
  <script>
  export default {
    name: "TopNavigation"
  };
  </script>
  
  <style scoped>
  .top-nav-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 90%;
    background-color: #ffffff;
    padding: 10px 50px;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .user-info {
    display: flex;
    align-items: center;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 10px;
  }
  
  .user-name {
    margin-right: 10px;
    font-weight: bold;
  }
  
  .dropdown {
    position: relative;
    display: inline-block;
  }
  
  .dropbtn {
    background: none;
    border: none;
    font-size: 12px;
    cursor: pointer;
    padding: 0;
  }
  
  .dropdown-content {
    display: none;
    position: absolute;
    background-color: #ffffff;
    min-width: 160px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    z-index: 1;
  }
  
  .dropdown-content a {
    color: black;
    padding: 12px 16px;
    text-decoration: none;
    display: flex;
    align-items: center;
  }
  
  .dropdown-content a:hover {
    background-color: #f1f1f1;
  }
  
  .dropdown-content .icon {
    width: 16px;
    height: 16px;
    margin-right: 8px;
  }
  
  .dropdown:hover .dropdown-content {
    display: block;
  }
  
  .extra-button {
    background-color: #6200ee;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 40px;
    cursor: pointer;
  }
  
  .extra-button:hover {
    background-color: #3700b3;
  }
  </style>
  