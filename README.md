---

# Joe's Pizza Discord Bot 🍕

Welcome to the Joe's Pizza Discord Bot repository. This bot offers a unique experience for Discord servers, providing functionalities like viewing balances, flipping coins, and transferring money between users.

## Features

- **Balance Checking**: Members can view their balance or the balance of another member.
  
- **Coin Flipping**: Users can flip a coin and win or lose coins based on the outcome.
  
- **Money Transfer**: Users can transfer coins to other users.

- **Banking System**: Offers features related to the bank, like depositing, withdrawing, and accruing interest. It also handles errors like insufficient funds.

- **Shops**: Members can visit shops to buy items using their coins. The shop system handles item listings, purchases, and inventory.


## Setup

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/BlakeFernandes/joes-pizza.git
    ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Set Up Environment Variables**:
   - Create a `.env` file in the root directory.
   - Add your database URL and any other secrets:
     ```
     DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
     TOKEN=""
     CLIENT_ID=""
     ```

4. **Run the Bot**:
    ```bash
    npm run dev
    ```

## Database Schema

The bot uses a PostgreSQL database with models like `User`, `Bank`, and `Shop`.

## Contributing

Pull requests are welcome! For significant changes, please open an issue first to discuss what you'd like to change.
