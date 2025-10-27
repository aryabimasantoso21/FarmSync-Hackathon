const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SensorLedger", function () {
  let sensorLedger;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    
    const SensorLedger = await ethers.getContractFactory("SensorLedger");
    sensorLedger = await SensorLedger.deploy();
    await sensorLedger.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should start with 0 records", async function () {
      expect(await sensorLedger.getTotalRecords()).to.equal(0);
    });
  });

  describe("Recording Data", function () {
    it("Should record sensor data correctly", async function () {
      const sensorId = "SENSOR_001";
      const weight = 850;
      const quality = 75;

      const tx = await sensorLedger.recordData(sensorId, weight, quality);
      await tx.wait();

      expect(await sensorLedger.getTotalRecords()).to.equal(1);

      const record = await sensorLedger.getRecord(1);
      expect(record[0]).to.equal(sensorId);
      expect(record[1]).to.equal(weight);
      expect(record[2]).to.equal(quality);
    });

    it("Should emit DataRecorded event", async function () {
      const sensorId = "SENSOR_002";
      const weight = 1000;
      const quality = 80;

      await expect(sensorLedger.recordData(sensorId, weight, quality))
        .to.emit(sensorLedger, "DataRecorded");
    });

    it("Should generate unique data hash", async function () {
      const sensorId = "SENSOR_003";
      const weight = 750;
      const quality = 85;

      await sensorLedger.recordData(sensorId, weight, quality);
      const record = await sensorLedger.getRecord(1);
      
      expect(record[4]).to.not.equal(ethers.ZeroHash);
    });
  });

  describe("Data Integrity", function () {
    it("Should verify data integrity correctly", async function () {
      const sensorId = "SENSOR_004";
      const weight = 900;
      const quality = 70;

      await sensorLedger.recordData(sensorId, weight, quality);
      
      const isValid = await sensorLedger.verifyDataIntegrity(1);
      expect(isValid).to.be.true;
    });

    it("Should fail for invalid record ID", async function () {
      await expect(
        sensorLedger.getRecord(999)
      ).to.be.revertedWith("Invalid record ID");
    });
  });

  describe("Multiple Records", function () {
    it("Should handle multiple records", async function () {
      // Record 3 sensor readings
      await sensorLedger.recordData("SENSOR_A", 800, 70);
      await sensorLedger.recordData("SENSOR_B", 950, 85);
      await sensorLedger.recordData("SENSOR_C", 1100, 90);

      expect(await sensorLedger.getTotalRecords()).to.equal(3);

      // Verify each record
      const record2 = await sensorLedger.getRecord(2);
      expect(record2[0]).to.equal("SENSOR_B");
      expect(record2[1]).to.equal(950);
    });
  });
});
