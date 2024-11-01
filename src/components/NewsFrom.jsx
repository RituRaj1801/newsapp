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

    // Fetch news items from API and insert into Firestore on component mount
    useEffect(() => {
        const fetchAndStoreNewsItems = async () => {
            // Fetch the time.json file
            // const timeResponse = await fetch('/time.json');
            // const timeData = await timeResponse.json();
            // const savedDate = new Date(timeData.time);
            // const currentDate = new Date();

            // Check if the current date is one day ahead of the saved date
            // savedDate.setDate(savedDate.getDate() + 1);
            // if (currentDate < savedDate) {
            //     console.log("Current date is not one day ahead. Exiting function.");
            //     return; // Exit the function if the condition is not met
            // }

            // Proceed with fetching news items if the condition is met
            const response = await fetch('https://newsapi.org/v2/everything?q=bitcoin&apiKey=40562ffe6b24479b8044fa96f74851e1');

            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                return;
            }

            const data = await response.json();
            const colRef = collection(db, 'news_item');

            // Insert each news item into Firestore
            const promises = data.articles.map(async (element) => {
                const news = {
                    title: element.title,
                    description: element.description,
                    imgURL: element.urlToImage,
                    readMore: element.url,
                    date: element.publishedAt,
                    source: element.source.name,
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
