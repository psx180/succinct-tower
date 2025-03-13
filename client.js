
const HTTP_API_URL = 'http://129.153.12.18:8000';
const WS_API_URL = 'ws://129.153.12.18:8000';
export async function submitProof(ticksList, allegedScore, print) {
    try {
        if (!allegedScore || !ticksList || ticksList.length === 0) {
            alert('Invalid proof data');
            return;
        }

        const jobID = await requestProof(ticksList, allegedScore);
        if (!jobID) {
            return;
        }
        const result = await getProofResult(jobID, print);
        console.log(result);
        return result;
    } catch (error) {
        console.error('Error creating proof:', error);
    }
}


async function requestProof(ticksList, allegedScore) {
    try {
        const inputData = JSON.stringify({
            ticks_list: ticksList,
            alleged_score : allegedScore
        });
        const response = await fetch(`${HTTP_API_URL}/prove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: inputData,
        });
        const { job_id: jobID } = await response.json();
        return jobID;
    } catch (error) {
        console.error('Error requesting proof:', error);
    }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getProofResult(jobID, print){
    return new Promise((resolve, reject) => {
        const wsEndpoint = `${WS_API_URL}/proof/${jobID}`;
        const socket = new WebSocket(wsEndpoint);

        socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);
            print(data);
            if (data.status === 'processing') {
                console.log('Proof is being processed...');
            } else if (data.status === 'complete') {
                socket.close();
                resolve(data);
            } else if (data.status === 'failed' || data.status === 'not_found') {
                reject(new Error('Proof generation failed'));
            }
        });

        socket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
            socket.close();
            reject(error);
        });

        setTimeout(() => {
            socket.close();
            reject(new Error('WebSocket connection timed out'));
        }, 5 * 60000); // 5 min timeout
    });
}

window.submitProof = submitProof;


//
