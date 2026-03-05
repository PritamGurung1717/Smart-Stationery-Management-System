import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Spinner } from 'react-bootstrap';
import { FaGift } from 'react-icons/fa';
import axios from 'axios';

const DonationList = () => {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ` };
      const response = await axios.get('http://localhost:5000/api/donations', { headers });
      if (response.data.success) {
        setDonations(response.data.donations || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner animation='border' /></div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', paddingBottom: '3rem' }}>
      <div style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', padding: '2rem 0', marginBottom: '2rem' }}>
        <Container>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <FaGift /> Donation Marketplace
          </h1>
          <Button variant='light' size='lg' onClick={() => navigate('/donations/create')} style={{ marginTop: '1rem' }}>
            Donate Item
          </Button>
        </Container>
      </div>
      <Container>
        {donations.length === 0 ? (
          <Card><Card.Body className='text-center py-5'><h4>No Donations Found</h4><Button variant='primary' onClick={() => navigate('/donations/create')}>Create First Donation</Button></Card.Body></Card>
        ) : (
          <Row xs={1} sm={2} md={3} lg={4} className='g-4'>
            {donations.map((donation) => (
              <Col key={donation.id}>
                <Card onClick={() => navigate(`/donations/`)} style={{ cursor: 'pointer', height: '100%' }}>
                  <div style={{ height: '200px', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {donation.images && donation.images[0] ? (
                      <img src={`http://localhost:5000`} alt={donation.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ fontSize: '3rem' }}>📦</div>
                    )}
                  </div>
                  <Card.Body>
                    <Badge bg='light' text='dark' style={{ marginBottom: '0.5rem' }}>{donation.category}</Badge>
                    <h5 style={{ fontWeight: 700 }}>{donation.title}</h5>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>{donation.description.substring(0, 100)}...</p>
                    <Badge bg={donation.status === 'available' ? 'success' : 'warning'}>{donation.status}</Badge>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
};

export default DonationList;
