# DC-Assignment2

## Instructions

- Clone/Unzip the project file.
- Open a terminal and run the following commands:
  - Navigate to the backend directory:
    ```bash
    cd dummy-master-backend
    ```
  - Install backend dependencies:
    ```bash
    npm i
    ```
  - Install `pm2` globally:
    ```bash
    npm install -g pm2
    ```
  - Start the backend using pm2:
    ```bash
    pm2 start .\pm2-distributed-word-count.json
    ```
- Open another terminal and run the following commands:
  - Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
  - Install frontend dependencies:
    ```bash
    npm i
    ```
  - Start the frontend:
    ```bash
    npm start
    ```
- Paste a sample paragraph in the **Input** area of the frontend UI.
