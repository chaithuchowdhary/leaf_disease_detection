import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import styled from '@emotion/styled';
import { io } from 'socket.io-client';

const Container = styled.div`
  min-height: 100vh;
  background: #f8f9fa;
  font-family: 'Inter', sans-serif;
`;

const Header = styled.div`
  background: white;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
`;

const Navigation = styled.div`
  display: flex;
  gap: 2rem;
`;

const NavItem = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: ${props => props.active ? '#000' : '#666'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: -1rem;
    left: 0;
    width: 100%;
    height: 2px;
    background: ${props => props.active ? '#000' : 'transparent'};
  }
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
`;

const WelcomeSection = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #666;
  margin: 0.5rem 0 0 0;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const UploadSection = styled.div`
  border: 2px dashed #e0e0e0;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #4f7cff;
    background: #f8f9fa;
  }
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  margin: 1rem 0;
  border-radius: 0.5rem;
`;

const FormSection = styled.div`
  margin-top: 1.5rem;
`;

const InputGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #4f7cff;
  }
`;

const Button = styled.button`
  background: #4f7cff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s ease;

  &:hover {
    background: #3d63cc;
  }

  &:disabled {
    background: #e0e0e0;
    cursor: not-allowed;
  }
`;

const ResultCard = styled(Card)`
  height: 100%;
`;

const ResultItem = styled.div`
  margin-bottom: 1rem;
`;

const ResultLabel = styled.div`
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #333;
`;

const ResultValue = styled.div`
  color: #666;
  line-height: 1.5;
`;

interface ModelPrediction {
  confidence_score: number;
  plant_type: string;
  condition: string;
}

interface WeatherData {
  humidity: number;
  temp_max: number;
  temp_min: number;
  temperature: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
}

interface ConditionData {
  soil_condition: string;
  environment_condition: string;
  plant_condition: string;
}

interface AnalysisResponse {
  decision: string;
  disease_name: string;
  reason: string;
  treatment: string;
  base64_image?: string;
  location: LocationData;
  weather: WeatherData;
  model_prediction: ModelPrediction;
  conditions?: ConditionData;
}

interface SocketResponse extends AnalysisResponse {
  base64_image: string;
}

const WeatherSection = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
`;

const WeatherTitle = styled.div`
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-size: 14px;
`;

const WeatherGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
`;

const WeatherItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const WeatherIcon = styled.span`
  font-size: 16px;
`;

const PredictionSection = styled.div`
  background: #eef2ff;
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
`;

const PredictionTitle = styled.div`
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-size: 14px;
`;

const PredictionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PredictionItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #555;

  span {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const ConfidenceBar = styled.div<{ score: number }>`
  width: 100%;
  height: 6px;
  background: #e0e7ff;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 4px;

  &::after {
    content: '';
    display: block;
    width: ${props => props.score * 100}%;
    height: 100%;
    background: #4f7cff;
    transition: width 0.3s ease;
  }
`;

const renderWeatherInfo = (weather: WeatherData) => (
  <WeatherSection>
    <WeatherTitle>
      <WeatherIcon>🌡️</WeatherIcon>
      Weather Information
    </WeatherTitle>
    <WeatherGrid>
      <WeatherItem>
        <span>
          <WeatherIcon>💧</WeatherIcon>
          Humidity:
        </span>
        {weather.humidity}%
      </WeatherItem>
      <WeatherItem>
        <span>
          <WeatherIcon>🌡️</WeatherIcon>
          Current:
        </span>
        {weather.temperature}°C
      </WeatherItem>
      <WeatherItem>
        <span>
          <WeatherIcon>⬆️</WeatherIcon>
          Max:
        </span>
        {weather.temp_max}°C
      </WeatherItem>
      <WeatherItem>
        <span>
          <WeatherIcon>⬇️</WeatherIcon>
          Min:
        </span>
        {weather.temp_min}°C
      </WeatherItem>
    </WeatherGrid>
  </WeatherSection>
);

const renderModelPrediction = (prediction: ModelPrediction) => (
  <PredictionSection>
    <PredictionTitle>
      <WeatherIcon>🔍</WeatherIcon>
      Model Prediction
    </PredictionTitle>
    <PredictionList>
      <PredictionItem>
        <span>
          <WeatherIcon>🌿</WeatherIcon>
          Plant Type
        </span>
        {prediction.plant_type}
      </PredictionItem>
      <PredictionItem>
        <span>
          <WeatherIcon>🔬</WeatherIcon>
          Condition
        </span>
        {prediction.condition.replace('_', ' ')}
      </PredictionItem>
      <PredictionItem>
        <div style={{ width: '100%' }}>
          <span>
            <WeatherIcon>📊</WeatherIcon>
            Confidence Score: {(prediction.confidence_score * 100).toFixed(1)}%
          </span>
          <ConfidenceBar score={prediction.confidence_score} />
        </div>
      </PredictionItem>
    </PredictionList>
  </PredictionSection>
);

const LeafDiseaseDetection: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [realtimeData, setRealtimeData] = useState<SocketResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'realtime' | 'history'>('realtime');
  const [historicalData, setHistoricalData] = useState<AnalysisResponse[]>([]);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [conditions, setConditions] = useState<ConditionData>({
    soil_condition: '',
    environment_condition: '',
    plant_condition: ''
  });

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io('http://127.0.0.1:5000');

    socket.on('connect', () => {
      setSocketConnected(true);
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      console.log('Socket disconnected');
    });

    socket.on('result', (data: SocketResponse) => {
      console.log('Received realtime analysis:', data);
      setRealtimeData(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Fetch historical data
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/history');
        if (!response.ok) {
          throw new Error('Failed to fetch historical data');
        }
        const data = await response.json();
        setHistoricalData(data);
      } catch (error) {
        console.error('Error fetching historical data:', error);
      }
    };

    fetchHistoricalData();
  }, [isAnalyzing,realtimeData]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    setAnalysisResult(null);
    setError('');
    
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  }, []);

  const getLocation = () => {
    return new Promise<LocationData>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject('Geolocation is not supported by your browser');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject('Unable to get location: ' + error.message);
        }
      );
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    onDrop,
    multiple: false
  });

  const handleConditionChange = (field: keyof ConditionData) => (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setConditions(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setError('');
    setLocationError('');

    try {
      // Get location first
      const locationData = await getLocation();
      setLocation(locationData);

      const formData = new FormData();
      formData.append('image', files[0]);
      formData.append('latitude', locationData.latitude.toString());
      formData.append('longitude', locationData.longitude.toString());
      
      // Add condition data to the form
      Object.entries(conditions).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const response = await fetch('http://127.0.0.1:5000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result);
      // If there's a base64_image in the response, use it for preview
      if (result.base64_image) {
        setPreview(`data:image/jpeg;base64,${result.base64_image}`);
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('location')) {
          setLocationError(err.message);
        } else {
          setError('Failed to analyze image. Please try again.');
        }
      }
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Container>
      <Header>
        <Logo>Leaf Disease Detection</Logo>
        <Navigation>
          <NavItem active={activeTab === 'realtime'} onClick={() => setActiveTab('realtime')}>
            Analyze
          </NavItem>
          <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
            History
          </NavItem>
        </Navigation>
      </Header>

      <MainContent>
        <WelcomeSection>
          <Title>Plant Disease Analysis</Title>
          <Subtitle>Upload a leaf image for instant disease detection</Subtitle>
        </WelcomeSection>

        {activeTab === 'realtime' ? (
          <CardGrid>
            <Card>
              <UploadSection {...getRootProps()}>
                <input {...getInputProps()} />
                {preview ? (
                  <PreviewImage src={preview} alt="Leaf preview" />
                ) : (
                  <>
                    <p>Drag and drop your leaf image here</p>
                    <p>or click to select files</p>
                    <small>Formats accepted: .png, .jpg, .jpeg</small>
                  </>
                )}
              </UploadSection>

              <FormSection>
                <InputGroup>
                  <Label>Soil Condition</Label>
                  <TextArea
                    placeholder="Describe the soil condition..."
                    value={conditions.soil_condition}
                    onChange={handleConditionChange('soil_condition')}
                  />
                </InputGroup>
                <InputGroup>
                  <Label>Environmental Condition</Label>
                  <TextArea
                    placeholder="Describe the environmental conditions..."
                    value={conditions.environment_condition}
                    onChange={handleConditionChange('environment_condition')}
                  />
                </InputGroup>
                <InputGroup>
                  <Label>Plant Condition</Label>
                  <TextArea
                    placeholder="Describe the overall plant condition..."
                    value={conditions.plant_condition}
                    onChange={handleConditionChange('plant_condition')}
                  />
                </InputGroup>
                <Button 
                  onClick={handleAnalyze}
                  disabled={files.length === 0 || isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
                </Button>
              </FormSection>
            </Card>

            <ResultCard>
              {error && (
                <ResultItem>
                  <ResultValue style={{ color: 'red' }}>{error}</ResultValue>
                </ResultItem>
              )}
              {locationError && (
                <ResultItem>
                  <ResultValue style={{ color: 'red' }}>{locationError}</ResultValue>
                </ResultItem>
              )}
              {analysisResult ? (
                <>
                  <ResultItem>
                    <ResultLabel>Disease Name</ResultLabel>
                    <ResultValue>{analysisResult.disease_name}</ResultValue>
                  </ResultItem>
                  <ResultItem>
                    <ResultLabel>Decision</ResultLabel>
                    <ResultValue>{analysisResult.decision}</ResultValue>
                  </ResultItem>
                  <ResultItem>
                    <ResultLabel>Reason</ResultLabel>
                    <ResultValue>{analysisResult.reason}</ResultValue>
                  </ResultItem>
                  <ResultItem>
                    <ResultLabel>Treatment</ResultLabel>
                    <ResultValue>{analysisResult.treatment}</ResultValue>
                  </ResultItem>
                  {renderWeatherInfo(analysisResult.weather)}
                  {renderModelPrediction(analysisResult.model_prediction)}
                </>
              ) : (
                <ResultValue style={{ textAlign: 'center', marginTop: '2rem' }}>
                  Upload an image and click Analyze to see the results
                </ResultValue>
              )}
            </ResultCard>
          </CardGrid>
        ) : (
          <CardGrid>
            {historicalData.length === 0 ? (
              <Card>
                <ResultValue style={{ textAlign: 'center' }}>
                  No historical data available
                </ResultValue>
              </Card>
            ) : (
              historicalData.map((item, index) => (
                <Card key={index}>
                  <PreviewImage 
                    src={`data:image/jpeg;base64,${item.base64_image}`}
                    alt={`Historical leaf ${index + 1}`}
                  />
                  <ResultItem>
                    <ResultLabel>Disease Name</ResultLabel>
                    <ResultValue>{item.disease_name}</ResultValue>
                  </ResultItem>
                  <ResultItem>
                    <ResultLabel>Decision</ResultLabel>
                    <ResultValue>{item.decision}</ResultValue>
                  </ResultItem>
                  <ResultItem>
                    <ResultLabel>Treatment</ResultLabel>
                    <ResultValue>{item.treatment}</ResultValue>
                  </ResultItem>
                  {renderWeatherInfo(item.weather)}
                  {renderModelPrediction(item.model_prediction)}
                </Card>
              ))
            )}
          </CardGrid>
        )}
      </MainContent>
    </Container>
  );
};

export default LeafDiseaseDetection; 