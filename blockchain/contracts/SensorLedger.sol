// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title SensorLedger
 * @dev Store IoT sensor data and TBS shipment tracking immutably on blockchain
 */
contract SensorLedger {
    struct SensorData {
        string sensorId;
        uint256 weight;
        uint256 quality;
        uint256 timestamp;
        bytes32 dataHash;
    }

    // TBS Shipment tracking
    struct Shipment {
        string estateId;
        string truckId;
        uint256 departureWeight;
        uint256 arrivalWeight;
        uint256 departureTimestamp;
        uint256 arrivalTimestamp;
        address seller;   // Estate address
        address buyer;    // Mill address
        bool departed;
        bool arrived;
        bool paid;
    }

    // Mapping from record ID to sensor data
    mapping(uint256 => SensorData) public records;
    uint256 public recordCount;

    // Mapping from truckId to shipment
    mapping(string => Shipment) public shipments;

    // Events
    event DataRecorded(
        uint256 indexed recordId,
        string sensorId,
        uint256 weight,
        uint256 quality,
        uint256 timestamp,
        bytes32 dataHash
    );

    event DepartureRecorded(
        string indexed truckId,
        string estateId,
        uint256 weight,
        uint256 timestamp,
        address seller
    );

    event ArrivalRecorded(
        string indexed truckId,
        string estateId,
        uint256 weight,
        uint256 timestamp,
        bool weightValid
    );

    event PaymentReleased(
        string indexed truckId,
        address indexed seller,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @dev Record sensor data on blockchain
     * @param _sensorId Unique sensor identifier
     * @param _weight Weight measurement
     * @param _quality Quality measurement
     */
    function recordData(
        string memory _sensorId,
        uint256 _weight,
        uint256 _quality //dihapus
    ) public returns (uint256) {
        uint256 timestamp = block.timestamp;
        
        // Create hash of the data for integrity verification
        bytes32 dataHash = keccak256(
            abi.encodePacked(_sensorId, _weight, _quality, timestamp)
        );

        recordCount++;
        records[recordCount] = SensorData({
            sensorId: _sensorId,
            weight: _weight,
            quality: _quality,
            timestamp: timestamp,
            dataHash: dataHash
        });

        emit DataRecorded(
            recordCount,
            _sensorId,
            _weight,
            _quality,
            timestamp,
            dataHash
        );

        return recordCount;
    }

    /**
     * @dev Get sensor data by record ID
     * @param _recordId The record ID to retrieve
     */
    function getRecord(uint256 _recordId)
        public
        view
        returns (
            string memory sensorId,
            uint256 weight,
            uint256 quality,
            uint256 timestamp,
            bytes32 dataHash
        )
    {
        require(_recordId > 0 && _recordId <= recordCount, "Invalid record ID");
        SensorData memory data = records[_recordId];
        return (data.sensorId, data.weight, data.quality, data.timestamp, data.dataHash);
    }

    /**
     * @dev Verify data integrity
     * @param _recordId Record ID to verify
     */
    function verifyDataIntegrity(uint256 _recordId)
        public
        view
        returns (bool)
    {
        require(_recordId > 0 && _recordId <= recordCount, "Invalid record ID");
        SensorData memory data = records[_recordId];
        
        bytes32 computedHash = keccak256(
            abi.encodePacked(data.sensorId, data.weight, data.quality, data.timestamp)
        );
        
        return computedHash == data.dataHash;
    }

    /**
     * @dev Get total number of records
     */
    function getTotalRecords() public view returns (uint256) {
        return recordCount;
    }

    // ========== TBS SUPPLY CHAIN FUNCTIONS ==========

    /**
     * @dev Record truck departure from estate (TAP-1)
     * @param _truckId Unique truck identifier
     * @param _weight Weight of TBS in kg
     * @param _estateId Estate identifier
     * @param _seller Estate address
     * @param _buyer Mill address
     */
    function recordDeparture(
        string memory _truckId,
        uint256 _weight,
        string memory _estateId,
        address _seller,
        address _buyer
    ) public returns (bool) {
        require(bytes(_truckId).length > 0, "Truck ID required");
        require(_weight > 0, "Weight must be positive");
        require(_seller != address(0), "Seller address required");
        require(_buyer != address(0), "Buyer address required");
        
        // Allow reuse if previous shipment is completed (paid)
        if (shipments[_truckId].departed) {
            require(shipments[_truckId].paid, "Truck already departed - previous shipment not completed");
        }

        shipments[_truckId] = Shipment({
            estateId: _estateId,
            truckId: _truckId,
            departureWeight: _weight,
            arrivalWeight: 0,
            departureTimestamp: block.timestamp,
            arrivalTimestamp: 0,
            seller: _seller,
            buyer: _buyer,
            departed: true,
            arrived: false,
            paid: false
        });

        emit DepartureRecorded(_truckId, _estateId, _weight, block.timestamp, _seller);
        return true;
    }

    /**
     * @dev Record truck arrival at mill (TAP-2)
     * @param _truckId Unique truck identifier
     * @param _weight Weight of TBS at arrival in kg
     * @param _estateId Estate identifier (must match departure estate)
     */
    function recordArrival(
        string memory _truckId,
        uint256 _weight,
        string memory _estateId
    ) public returns (bool) {
        Shipment storage shipment = shipments[_truckId];
        
        require(shipment.departed, "Truck has not departed yet");
        require(!shipment.arrived, "Truck already arrived");
        require(_weight > 0, "Weight must be positive");
        
        // Validate estate ID matches departure
        require(
            keccak256(abi.encodePacked(shipment.estateId)) == keccak256(abi.encodePacked(_estateId)),
            "Estate ID mismatch - fraud detected"
        );

        shipment.arrivalWeight = _weight;
        shipment.arrivalTimestamp = block.timestamp;
        shipment.arrived = true;

        // Check weight validity (tolerance: 1kg)
        bool weightValid = isWeightValid(shipment.departureWeight, _weight);

        emit ArrivalRecorded(_truckId, shipment.estateId, _weight, block.timestamp, weightValid);
        
        return weightValid;
    }

    /**
     * @dev Check if weight difference is within tolerance (1kg)
     * @param _departureWeight Original weight at departure (in kg)
     * @param _arrivalWeight Weight at arrival (in kg)
     */
    function isWeightValid(uint256 _departureWeight, uint256 _arrivalWeight) 
        public 
        pure 
        returns (bool) 
    {
        if (_arrivalWeight > _departureWeight) {
            return false; // Weight increased (fraud)
        }
        
        uint256 weightDiff = _departureWeight - _arrivalWeight;
        return weightDiff <= 1; // Tolerance: 1kg maximum difference
    }

    /**
     * @dev Release payment from mill to estate (automatic payment)
     * @param _truckId Unique truck identifier
     * @param _pricePerKg Price per kg in wei
     */
    function releasePayment(
        string memory _truckId,
        uint256 _pricePerKg
    ) public payable returns (bool) {
        Shipment storage shipment = shipments[_truckId];
        
        require(shipment.departed, "Truck has not departed");
        require(shipment.arrived, "Truck has not arrived yet");
        require(!shipment.paid, "Payment already released");
        require(msg.sender == shipment.buyer, "Only buyer can release payment");
        
        // Verify weight is valid (within tolerance)
        bool weightValid = isWeightValid(shipment.departureWeight, shipment.arrivalWeight);
        require(weightValid, "Weight fraud detected - payment blocked");

        // Calculate payment based on arrival weight
        uint256 paymentAmount = shipment.arrivalWeight * _pricePerKg;
        require(msg.value >= paymentAmount, "Insufficient payment");

        // Mark as paid
        shipment.paid = true;

        // Transfer payment to seller (estate)
        payable(shipment.seller).transfer(paymentAmount);

        // Refund excess if any
        if (msg.value > paymentAmount) {
            payable(msg.sender).transfer(msg.value - paymentAmount);
        }

        emit PaymentReleased(_truckId, shipment.seller, paymentAmount, block.timestamp);
        return true;
    }

    /**
     * @dev Get shipment details
     * @param _truckId Truck identifier
     */
    function getShipment(string memory _truckId)
        public
        view
        returns (
            string memory estateId,
            uint256 departureWeight,
            uint256 arrivalWeight,
            uint256 departureTimestamp,
            uint256 arrivalTimestamp,
            address seller,
            address buyer,
            bool departed,
            bool arrived,
            bool paid
        )
    {
        Shipment memory s = shipments[_truckId];
        return (
            s.estateId,
            s.departureWeight,
            s.arrivalWeight,
            s.departureTimestamp,
            s.arrivalTimestamp,
            s.seller,
            s.buyer,
            s.departed,
            s.arrived,
            s.paid
        );
    }

    /**
     * @dev Check if shipment is valid for payment
     * @param _truckId Truck identifier
     */
    function isShipmentValid(string memory _truckId) 
        public 
        view 
        returns (bool) 
    {
        Shipment memory s = shipments[_truckId];
        return s.departed && s.arrived && !s.paid && 
               isWeightValid(s.departureWeight, s.arrivalWeight);
    }
}
