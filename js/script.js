document.addEventListener('DOMContentLoaded', function() {
    const workForm = document.getElementById('work-form');
    const workTableBody = document.getElementById('work-table').querySelector('tbody');
    const summaryTableBody = document.getElementById('summary-tbody');
    const workData = JSON.parse(localStorage.getItem('workData')) || [];
    let workNumber = workData.length ? workData[workData.length - 1].workNumber + 1 : 1;
    let map, geocoder, markers = {};

    workForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const address = document.getElementById('work-address').value;
        const price = parseFloat(document.getElementById('work-price').value);
        const extraHours = parseFloat(document.getElementById('extra-hours').value);
        const totalPrice = price + (extraHours * 40); // Assuming $40 per extra hour
        const date = formatDate(new Date());

        const work = {
            workNumber,
            date,
            address,
            price,
            extraHours,
            totalPrice,
            status: 'unpaid',
            paymentDate: null
        };

        workData.push(work);
        localStorage.setItem('workData', JSON.stringify(workData));
        addWorkToTable(work);
        addMarkerToMap(work.address);
        updateSummary();

        workNumber++;
        workForm.reset();
    });

    function addWorkToTable(work) {
        const row = document.createElement('tr');
        row.classList.add(work.status);
        row.innerHTML = `
            <td>${work.date}</td>
            <td><a href="#" onclick="openInMaps('${work.address}')">${work.address}</a></td>
            <td>${work.price}</td>
            <td>${work.extraHours}</td>
            <td>${work.totalPrice.toFixed(2)}</td>
            <td>
                <button class="status-btn unpaid" onclick="updateStatus(${work.workNumber}, 'unpaid')">Unpaid</button>
                <button class="status-btn processing" onclick="updateStatus(${work.workNumber}, 'processing')">Processing</button>
                <button class="status-btn paid" onclick="updateStatus(${work.workNumber}, 'paid')">Paid</button>
            </td>
            <td>${work.paymentDate ? work.paymentDate : 'N/A'}</td>
            <td>
                <button onclick="editWork(${work.workNumber})"><i class="fas fa-edit"></i> Edit</button>
                <button onclick="deleteWork(${work.workNumber})"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
        workTableBody.appendChild(row);
    }

    function updateStatus(workNumber, status) {
        const work = workData.find(work => work.workNumber === workNumber);
        work.status = status;
        if (status === 'paid') {
            work.paymentDate = formatDate(new Date());
        } else {
            work.paymentDate = null;
        }
        localStorage.setItem('workData', JSON.stringify(workData));
        updateWorkInTable(work);
        updateSummary();
    }

    function updateWorkInTable(work) {
        const rows = workTableBody.getElementsByTagName('tr');
        for (let row of rows) {
            if (parseInt(row.cells[0].textContent) === work.workNumber) {
                row.className = work.status;
                row.cells[6].textContent = work.paymentDate ? work.paymentDate : 'N/A';
                break;
            }
        }
    }

    function updateSummary() {
        const totalExtraHours = workData.reduce((sum, work) => sum + work.extraHours, 0);
        const totalPrice = workData.reduce((sum, work) => sum + work.totalPrice, 0);
        const paidAmount = workData.filter(work => work.status === 'paid').reduce((sum, work) => sum + work.totalPrice, 0);
        const unpaidAmount = totalPrice - paidAmount;

        summaryTableBody.innerHTML = `
            <tr>
                <td>${totalExtraHours}</td>
                <td>${totalPrice.toFixed(2)}</td>
                <td>${paidAmount.toFixed(2)}</td>
                <td>${unpaidAmount.toFixed(2)}</td>
            </tr>
        `;
    }

    function openInMaps(address) {
        window.open(`https://maps.apple.com/?daddr=${encodeURIComponent(address)}`, '_blank');
    }

    function editWork(workNumber) {
        const work = workData.find(work => work.workNumber === workNumber);
        document.getElementById('work-address').value = work.address;
        document.getElementById('work-price').value = work.price;
        document.getElementById('extra-hours').value = work.extraHours;
        deleteWork(workNumber);
    }

    function deleteWork(workNumber) {
        const index = workData.findIndex(work => work.workNumber === workNumber);
        if (index !== -1) {
            workData.splice(index, 1);
            localStorage.setItem('workData', JSON.stringify(workData));
            location.reload();
        }
    }

    function formatDate(date) {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: 12,
            center: { lat: 39.9526, lng: -75.1652 } // Centered on Philadelphia
        });
        geocoder = new google.maps.Geocoder();
    }

    function addMarkerToMap(address) {
        if (markers[address]) return; // Marker already exists

        geocoder.geocode({ address: address }, function(results, status) {
            if (status === 'OK') {
                const location = results[0].geometry.location;
                const marker = new google.maps.Marker({
                    map: map,
                    position: location
                });
                markers[address] = marker;
            } else {
                console.error('Geocode was not successful for the following reason: ' + status);
            }
        });
    }

    function updateClock() {
        const clock = document.getElementById('clock');
        const now = new Date();
        clock.innerHTML = now.toLocaleTimeString();
    }

    setInterval(updateClock, 1000);
    updateClock();
    initMap();
    workData.forEach(work => addWorkToTable(work));
    updateSummary();
});
