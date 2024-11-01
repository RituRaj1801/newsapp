import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore/lite';

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID,
    measurementId: process.env.REACT_APP_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function NewsForm() {
    const [newsItems, setNewsItems] = useState([]);

    useEffect(() => {
        const fetchAndStoreNewsItems = async () => {
            try {
                const timeResponse = await fetch('/time.json');
                const timeData = await timeResponse.json();
                const savedDate = new Date(timeData.time);
                const currentDate = new Date();

                // Check if the current date is at least 30 minutes ahead of the saved date
                const thirtyMinutesInMilliseconds = 30 * 60 * 1000; // 30 minutes in milliseconds
                if (currentDate - savedDate < thirtyMinutesInMilliseconds) {
                    console.log("Current date is not at least 30 minutes ahead. Exiting function.");
                    return; // Exit the function if the condition is not met
                }
                if (currentDate < savedDate) {
                    console.log("Current date is not one day ahead. Exiting function.");
                    return; // Exit the function if the condition is not met
                }
                const response = await fetch('https://newsdata.io/api/1/latest?apikey=' + process.env.REACT_APP_NEWS_API);
                if (!response.ok) {

                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const colRef = collection(db, 'news_item');

                // Insert each news item into Firestore
                const promises = data.results.map(async (element) => {
                    const news = {
                        title: element.title,
                        description: element.description,
                        imgURL: element.image_url,
                        readMore: element.link,
                        date: element.pubDate,
                        source: element.source_name,
                        category: "all"
                    };

                    try {
                        await addDoc(colRef, news);
                        console.log("News item added:", news);
                    } catch (error) {
                        console.error("Error adding news item:", error);
                    }
                });

                await Promise.all(promises); // Wait for all add operations to complete

                // Refresh the news items after adding
                const updatedItems = await getDocs(colRef);
                setNewsItems(updatedItems.docs.map(doc => ({ ...doc.data(), id: doc.id })));
            } catch (error) {
                console.error("Error fetching or storing news items:", error);
            }
        };

        fetchAndStoreNewsItems();
    }, []);

    return (
        <div>
            <h2>Current News Items</h2>
            <ul>
                {newsItems.map(item => (
                    <li key={item.id}>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        <img src={item.imgURL} alt={item.title} width="100" />
                        <p>Source: {item.source}</p>
                        <p>Date: {new Date(item.date).toLocaleString()}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
