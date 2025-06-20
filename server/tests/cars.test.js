const request = require('supertest');
const app = require('../index');
const db = require('../db');

describe('Car Endpoints', () => {
  let testCar;

  beforeAll(async () => {
    // Clean up any cars with the specific test make/model before tests if necessary
    await db.query("DELETE FROM cars WHERE make = $1 AND model = $2", ['TestMake', 'TestModel']);

    // Add a test car to the DB
    const carData = {
      make: 'TestMake',
      model: 'TestModel',
      year: 2024,
      price_per_day: 100.00,
      available: true,
    };
    const result = await db.query(
      'INSERT INTO cars (make, model, year, price_per_day, available) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [carData.make, carData.model, carData.year, carData.price_per_day, carData.available]
    );
    if (result.rows.length > 0) {
      testCar = result.rows[0];
    } else {
      throw new Error('Failed to create test car in beforeAll');
    }
  });

  afterAll(async () => {
    // Clean up the test car
    if (testCar) {
      await db.query("DELETE FROM cars WHERE id = $1", [testCar.id]);
    }
    // Close db connection (handled by auth.test.js or a global setup/teardown if running all tests together)
    // If running this file standalone, you might need a db.end() here too.
    // For now, assuming auth.test.js's afterAll handles the final db.end() when Jest runs all tests.
    // If Jest runs files in separate processes, each test suite's afterAll should manage its resources or db.end() should be idempotent.
    // The current db.end() is idempotent due to the NODE_ENV check.
    await db.end();
  });

  it('should fetch all cars', async () => {
    const res = await request(app).get('/api/cars');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);

    // Check if our test car is in the list
    const foundTestCar = res.body.find(car => car.id === testCar.id);
    expect(foundTestCar).toBeDefined();
    expect(foundTestCar.make).toEqual(testCar.make);
  });

  it('should fetch the test car by its ID', async () => {
    if (!testCar) throw new Error('Test car not created'); // Guard against testCar not being set

    const res = await request(app).get(`/api/cars/${testCar.id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('id', testCar.id);
    expect(res.body).toHaveProperty('make', testCar.make);
    expect(res.body).toHaveProperty('model', testCar.model);
  });

  it('should return 404 for a non-existent car ID', async () => {
    const nonExistentCarId = 999999;
    const res = await request(app).get(`/api/cars/${nonExistentCarId}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message', 'Car not found.');
  });

  // Example for POST, PUT, DELETE (requires auth and more setup)
  // These would typically require a logged-in user with a token.
  // For simplicity, these are commented out.
  /*
  describe('Protected Car Endpoints', () => {
    let adminToken; // Assume admin login happens in a beforeAll block

    beforeAll(async () => {
      // Login as admin user to get token
      // const loginRes = await request(app).post('/api/auth/login').send({email: 'admin@example.com', password: 'adminpassword'});
      // adminToken = loginRes.body.token;
      // For now, we'll skip this and assume no auth for POST/PUT/DELETE for a simplified test
    });

    it('should create a new car (requires auth - not implemented in this test)', async () => {
      const newCar = { make: 'NewMake', model: 'NewModel', year: 2025, price_per_day: 150 };
      const res = await request(app)
        .post('/api/cars')
        // .set('Authorization', `Bearer ${adminToken}`) // If auth is implemented
        .send(newCar);

      // If auth is not implemented on the route yet, this might pass or fail differently
      // For now, assuming it might fail with 401/403 if auth is strictly enforced
      // Or succeed if the route is currently open for testing purposes
      expect(res.statusCode).toEqual(201); // Or other appropriate status
      expect(res.body).toHaveProperty('id');
      expect(res.body.make).toEqual(newCar.make);
      // Cleanup: await db.query("DELETE FROM cars WHERE id = $1", [res.body.id]);
    });
  });
  */
});
