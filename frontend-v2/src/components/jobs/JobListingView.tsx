import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Slider,
  FormControlLabel,
  Checkbox,
  Collapse,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterListIcon,
  AttachMoney as SalaryIcon,
  WorkOutline as ExperienceIcon,
  ExpandLess,
  ExpandMore,
  Clear as ClearIcon,
  Save as SaveIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../../hooks/useJobs';
import { JobStatus } from '../../types/api';
import LoadingState from '../common/LoadingState';
import ErrorState from '../common/ErrorState';
import { formatDistanceToNow } from 'date-fns';
import { alpha } from '@mui/material/styles';

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (3-5 years)' },
  { value: 'senior', label: 'Senior Level (5+ years)' },
  { value: 'lead', label: 'Lead/Manager (8+ years)' },
];

const COMMON_LOCATIONS = [
  'San Francisco, CA',
  'New York, NY',
  'Remote',
  'London, UK',
  'Berlin, DE',
];

const COMMON_SKILLS = [
  'React',
  'Node.js',
  'Python',
  'Java',
  'TypeScript',
  'AWS',
  'Docker',
  'Kubernetes',
  'Machine Learning',
  'Data Science',
];

const JobListingView = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = React.useState(false);
  const [expandedFilters, setExpandedFilters] = React.useState<string[]>(['status', 'location']);
  const [filters, setFilters] = React.useState({
    status: '',
    department: '',
    search: '',
    location: '',
    experienceLevel: '',
    skills: [] as string[],
    salaryRange: [0, 300] as [number, number],
    remote: false,
    page: 1,
    limit: 10,
  });

  const {
    jobs,
    totalPages,
    isLoadingJobs,
    jobsError,
    deleteJob,
    isDeleting,
  } = useJobs(filters);

  const handleFilterChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | null,
    newValue?: any
  ) => {
    setFilters(prev => ({
      ...prev,
      [field]: event?.target?.value ?? newValue,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handleSalaryRangeChange = (event: Event, newValue: number | number[]) => {
    setFilters(prev => ({
      ...prev,
      salaryRange: newValue as [number, number],
      page: 1,
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
      page: 1,
    }));
  };

  const handleExpandFilter = (section: string) => {
    setExpandedFilters(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleClearFilters = () => {
    setFilters({
      status: '',
      department: '',
      search: '',
      location: '',
      experienceLevel: '',
      skills: [],
      salaryRange: [0, 300],
      remote: false,
      page: 1,
      limit: 10,
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      await deleteJob(id);
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.PUBLISHED:
        return {
          color: theme.palette.success.main,
          backgroundColor: alpha(theme.palette.success.main, 0.1),
        };
      case JobStatus.DRAFT:
        return {
          color: theme.palette.warning.main,
          backgroundColor: alpha(theme.palette.warning.main, 0.1),
        };
      case JobStatus.CLOSED:
        return {
          color: theme.palette.error.main,
          backgroundColor: alpha(theme.palette.error.main, 0.1),
        };
      default:
        return {
          color: theme.palette.grey[500],
          backgroundColor: theme.palette.grey[100],
        };
    }
  };

  const renderFilterDrawer = () => (
    <Drawer
      anchor="right"
      open={isFilterDrawerOpen}
      onClose={() => setIsFilterDrawerOpen(false)}
      PaperProps={{
        sx: { width: 320, p: 2 },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Filters</Typography>
        <Button
          startIcon={<ClearIcon />}
          onClick={handleClearFilters}
          size="small"
        >
          Clear All
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <List>
        {/* Status Filter */}
        <ListItem
          component="div"
          sx={{ cursor: 'pointer' }}
          onClick={() => handleExpandFilter('status')}
        >
          <ListItemIcon>
            <BusinessIcon />
          </ListItemIcon>
          <ListItemText primary="Status" />
          {expandedFilters.includes('status') ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={expandedFilters.includes('status')}>
          <List component="div" disablePadding>
            <ListItem sx={{ pl: 4 }}>
              <TextField
                select
                fullWidth
                value={filters.status}
                onChange={handleFilterChange('status')}
                size="small"
              >
                <MenuItem value="">All Statuses</MenuItem>
                {Object.values(JobStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </ListItem>
          </List>
        </Collapse>

        {/* Location Filter */}
        <ListItem
          component="div"
          sx={{ cursor: 'pointer' }}
          onClick={() => handleExpandFilter('location')}
        >
          <ListItemIcon>
            <LocationIcon />
          </ListItemIcon>
          <ListItemText primary="Location" />
          {expandedFilters.includes('location') ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={expandedFilters.includes('location')}>
          <List component="div" disablePadding>
            <ListItem sx={{ pl: 4 }}>
              <Stack spacing={1} width="100%">
                <TextField
                  fullWidth
                  placeholder="Enter location"
                  value={filters.location}
                  onChange={handleFilterChange('location')}
                  size="small"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={filters.remote}
                      onChange={(e) => handleFilterChange('remote')(null, e.target.checked)}
                      size="small"
                    />
                  }
                  label="Remote only"
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {COMMON_LOCATIONS.map((loc) => (
                    <Chip
                      key={loc}
                      label={loc}
                      size="small"
                      onClick={() => handleFilterChange('location')(null, loc)}
                      variant={filters.location === loc ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Stack>
            </ListItem>
          </List>
        </Collapse>

        {/* Salary Range Filter */}
        <ListItem
          component="div"
          sx={{ cursor: 'pointer' }}
          onClick={() => handleExpandFilter('salary')}
        >
          <ListItemIcon>
            <SalaryIcon />
          </ListItemIcon>
          <ListItemText primary="Salary Range" />
          {expandedFilters.includes('salary') ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={expandedFilters.includes('salary')}>
          <List component="div" disablePadding>
            <ListItem sx={{ pl: 4 }}>
              <Box sx={{ width: '100%' }}>
                <Slider
                  value={filters.salaryRange}
                  onChange={handleSalaryRangeChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={300}
                  step={10}
                  valueLabelFormat={(value) => `$${value}k`}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    ${filters.salaryRange[0]}k
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ${filters.salaryRange[1]}k
                  </Typography>
                </Box>
              </Box>
            </ListItem>
          </List>
        </Collapse>

        {/* Experience Level Filter */}
        <ListItem
          component="div"
          sx={{ cursor: 'pointer' }}
          onClick={() => handleExpandFilter('experience')}
        >
          <ListItemIcon>
            <ExperienceIcon />
          </ListItemIcon>
          <ListItemText primary="Experience Level" />
          {expandedFilters.includes('experience') ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={expandedFilters.includes('experience')}>
          <List component="div" disablePadding>
            <ListItem sx={{ pl: 4 }}>
              <TextField
                select
                fullWidth
                value={filters.experienceLevel}
                onChange={handleFilterChange('experienceLevel')}
                size="small"
              >
                <MenuItem value="">Any Experience</MenuItem>
                {EXPERIENCE_LEVELS.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </TextField>
            </ListItem>
          </List>
        </Collapse>

        {/* Skills Filter */}
        <ListItem
          component="div"
          sx={{ cursor: 'pointer' }}
          onClick={() => handleExpandFilter('skills')}
        >
          <ListItemIcon>
            <BusinessIcon />
          </ListItemIcon>
          <ListItemText primary="Required Skills" />
          {expandedFilters.includes('skills') ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={expandedFilters.includes('skills')}>
          <List component="div" disablePadding>
            <ListItem sx={{ pl: 4 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {COMMON_SKILLS.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    size="small"
                    onClick={() => handleSkillToggle(skill)}
                    color={filters.skills.includes(skill) ? 'primary' : 'default'}
                    variant={filters.skills.includes(skill) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </ListItem>
          </List>
        </Collapse>
      </List>
    </Drawer>
  );

  if (jobsError) {
    return <ErrorState message="Error loading jobs. Please try again." />;
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          Job Listings
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setIsFilterDrawerOpen(true)}
          >
            Filters
            {Object.values(filters).filter(v => 
              Array.isArray(v) ? v.length > 0 : Boolean(v)
            ).length > 2 && (
              <Chip
                label={Object.values(filters).filter(v => 
                  Array.isArray(v) ? v.length > 0 : Boolean(v)
                ).length - 2}
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/jobs/create')}
          >
            Create Job
          </Button>
        </Stack>
      </Box>

      {/* Search Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: theme.palette.background.default,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr' }, gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by title, skills, or keywords..."
            value={filters.search}
            onChange={handleFilterChange('search')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            fullWidth
            value={filters.status}
            onChange={handleFilterChange('status')}
            placeholder="Status"
          >
            <MenuItem value="">All Statuses</MenuItem>
            {Object.values(JobStatus).map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            placeholder="Department"
            value={filters.department}
            onChange={handleFilterChange('department')}
          />
        </Box>
      </Paper>

      {/* Active Filters */}
      {Object.values(filters).some(v => Array.isArray(v) ? v.length > 0 : Boolean(v)) && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {filters.status && (
            <Chip
              label={`Status: ${filters.status}`}
              onDelete={() => handleFilterChange('status')(null, '')}
              size="small"
            />
          )}
          {filters.department && (
            <Chip
              label={`Department: ${filters.department}`}
              onDelete={() => handleFilterChange('department')(null, '')}
              size="small"
            />
          )}
          {filters.location && (
            <Chip
              label={`Location: ${filters.location}`}
              onDelete={() => handleFilterChange('location')(null, '')}
              size="small"
            />
          )}
          {filters.remote && (
            <Chip
              label="Remote Only"
              onDelete={() => handleFilterChange('remote')(null, false)}
              size="small"
            />
          )}
          {filters.experienceLevel && (
            <Chip
              label={`Experience: ${EXPERIENCE_LEVELS.find(l => l.value === filters.experienceLevel)?.label}`}
              onDelete={() => handleFilterChange('experienceLevel')(null, '')}
              size="small"
            />
          )}
          {filters.skills.map(skill => (
            <Chip
              key={skill}
              label={skill}
              onDelete={() => handleSkillToggle(skill)}
              size="small"
            />
          ))}
          {(filters.salaryRange[0] > 0 || filters.salaryRange[1] < 300) && (
            <Chip
              label={`Salary: $${filters.salaryRange[0]}k - $${filters.salaryRange[1]}k`}
              onDelete={() => handleFilterChange('salaryRange')(null, [0, 300])}
              size="small"
            />
          )}
        </Box>
      )}

      {/* Job Cards */}
      {isLoadingJobs ? (
        <LoadingState message="Loading jobs..." />
      ) : jobs.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No jobs found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Try adjusting your filters or create a new job posting.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            sx={{ mt: 2 }}
          >
            Clear Filters
          </Button>
        </Box>
      ) : (
        <Stack spacing={2}>
          {jobs.map((job) => (
            <Card key={job.id} sx={{ position: 'relative' }}>
              <CardContent>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" component="div">
                          {job.title}
                        </Typography>
                        <Chip
                          label={job.status}
                          size="small"
                          sx={getStatusColor(job.status)}
                        />
                      </Box>
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{ color: 'text.secondary', mb: 2 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BusinessIcon fontSize="small" />
                          <Typography variant="body2">{job.department}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationIcon fontSize="small" />
                          <Typography variant="body2">{job.location}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ScheduleIcon fontSize="small" />
                          <Typography variant="body2">
                            Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                          </Typography>
                        </Box>
                        {job.salary && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <SalaryIcon fontSize="small" />
                            <Typography variant="body2">
                              ${job.salary.min / 1000}k - ${job.salary.max / 1000}k
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mb: 2,
                        }}
                      >
                        {job.description}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {job.requirements.slice(0, 3).map((req, index) => (
                          <Chip
                            key={index}
                            label={req}
                            size="small"
                            sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}
                          />
                        ))}
                        {job.requirements.length > 3 && (
                          <Chip
                            label={`+${job.requirements.length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                      height: '100%',
                      justifyContent: 'center',
                      alignItems: { xs: 'flex-start', md: 'flex-end' },
                    }}
                  >
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="View Details">
                        <Button
                          variant="contained"
                          onClick={() => navigate(`/jobs/${job.id}`)}
                        >
                          View Details
                        </Button>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/jobs/${job.id}/edit`)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Share">
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.origin + `/jobs/${job.id}`);
                            // You might want to show a snackbar here
                          }}
                        >
                          <ShareIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(job.id)}
                          disabled={isDeleting}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {renderFilterDrawer()}
    </Box>
  );
};

export default JobListingView; 