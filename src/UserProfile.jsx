import React, { useEffect, useState } from 'react';
import { GraphQLClient, gql } from 'graphql-request';

// Initialize the GraphQL client with the DSCVR endpoint
const client = new GraphQLClient('https://api.dscvr.one/graphql');

// Define the GraphQL query for fetching user data by username
const GET_USER_DATA = gql`
  query GetUserData($username: String!) {
    userByName(name: $username) {
      id
      followingCount
      followerCount
      dscvrPoints
    }
  }
`;

const UserProfile = ({ username, walletAddress, avatar }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = async (username) => {
    try {
      setLoading(true);
      const data = await client.request(GET_USER_DATA, { username });
      setUserData(data.userByName);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch user data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData(username);
  }, [username]);

  const getPlaceholderAvatar = (name) => {
    const initials = name.substring(0, 2).toUpperCase();
    return `https://via.placeholder.com/80?text=${initials}`;
  };

  const shortenWalletAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return userData ? (
    <div style={styles.card}>
      <div style={styles.imageContainer}>
        <img
          src={avatar || getPlaceholderAvatar(username)}
          alt={`${username}'s avatar`}
          style={styles.image}
        />
      </div>
      <div style={styles.details}>
        <p style={styles.username}>{username}</p>
        <p style={styles.detailItem}>
          <strong style={styles.followers}>{userData.followerCount}</strong> Followers &nbsp;&nbsp;
          <strong style={styles.following}>{userData.followingCount}</strong> Following
        </p>
        <p style={styles.detailItem}>
          <img src="icon_url_here" alt="DSCVR Points Icon" style={styles.icon} />
          {userData.dscvrPoints}
        </p>
        <p style={styles.walletAddress}>
          Wallet Address: <span style={styles.shortenedWallet} title={walletAddress}>{shortenWalletAddress(walletAddress)}</span>
        </p>
      </div>
    </div>
  ) : (
    <div>No user data found</div>
  );
};

// Inline styles
const styles = {
  card: {
    display: 'flex',
    border: '1px solid #444',
    borderRadius: '12px',
    padding: '16px',
    maxWidth: '450px', // Increased width by 50% from 300px to 450px
    minWidth: '70vw',
    margin: 'auto',
    backgroundColor: '#1b1b2f',
    color: '#fff',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    justifyContent: 'space-evenly',
    marginBottom: '20px',
  },
  imageContainer: {
    marginRight: '20px',
    display: 'flex',
    alignItems: 'center',
    // marginLeft: '10px', 
  },
  image: {
   
    height: '60%',
    // width: "auto",
    borderRadius: '50%',
    aspectRatio: '1/1',
    objectFit: 'cover',
    border: '2px solid #00bcd4',
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'left',
  },
  username: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  detailItem: {
    fontSize: '14px',
    marginBottom: '4px',
  },
  followers: {
    color: '#00bcd4',
  },
  following: {
    color: '#00bcd4',
  },
  icon: {
    width: '20px',
    marginRight: '4px',
  },
  walletAddress: {
    fontSize: '14px',
    marginTop: '8px',
    color: '#ddd',
  },
  shortenedWallet: {
    cursor: 'pointer',
    borderBottom: '1px dotted #ddd',
  },
};

export default UserProfile;
