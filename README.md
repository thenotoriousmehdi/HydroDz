# HydroDz - Water Management System

HydroDz is a comprehensive water management system designed to monitor and manage water resources, particularly focusing on dam monitoring and water quality analysis. The system provides real-time monitoring, data visualization, and analysis tools for water management professionals.

## Features

- **Real-time Dam Monitoring**
  - Water level tracking
  - Flow rate monitoring
  - Reservoir capacity visualization
  - Historical data analysis

- **Water Quality Analysis**
  - pH level monitoring
  - Turbidity tracking
  - Temperature monitoring
  - Chemical composition analysis

- **Queue Management System**
  - Real-time queue status monitoring
  - Queue length tracking
  - Processing time analysis
  - System performance metrics

## Project Structure

```
HydroDz/
├── FrontEnd/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.jsx
├── BackEnd/
│   ├── filtrage/
│   ├── queue/
│   └── server.js
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB
- Python 3.x (for backend processing)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/HydroDz.git
cd HydroDz
```

2. Install Frontend dependencies:
```bash
cd FrontEnd
npm install
```

3. Install Backend dependencies:
```bash
cd ../BackEnd
npm install
```

4. Set up environment variables:
Create a `.env` file in the BackEnd directory with the following variables:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

## Running the Application

1. Start the Backend server:
```bash
cd BackEnd
npm start
```

2. Start the Frontend development server:
```bash
cd FrontEnd
npm start
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Dam Monitoring
- `GET /api/dam/status` - Get current dam status
- `GET /api/dam/history` - Get historical dam data
- `POST /api/dam/update` - Update dam measurements

### Water Quality
- `GET /api/quality/current` - Get current water quality metrics
- `GET /api/quality/history` - Get historical water quality data
- `POST /api/quality/update` - Update water quality measurements

### Queue Management
- `GET /api/queue/status` - Get current queue status
- `GET /api/queue/history` - Get queue history
- `POST /api/queue/update` - Update queue status

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

Your Name - your.email@example.com
Project Link: https://github.com/yourusername/HydroDz 