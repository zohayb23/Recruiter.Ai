import React, { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import HiringFunnelChart from './charts/HiringFunnelChart';
import RecruiterMetricsChart from './charts/RecruiterMetricsChart';
import SourceEffectivenessChart from './charts/SourceEffectivenessChart';
import TimeToHireChart from './charts/TimeToHireChart';

type DateRange = '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'custom';

interface DateRangeOption {
  label: string;
  value: DateRange;
  getDateRange: () => [Date, Date];
}

const dateRangeOptions: DateRangeOption[] = [
  {
    label: 'Last 7 Days',
    value: '7days',
    getDateRange: () => [subDays(new Date(), 7), new Date()],
  },
  {
    label: 'Last 30 Days',
    value: '30days',
    getDateRange: () => [subDays(new Date(), 30), new Date()],
  },
  {
    label: 'This Month',
    value: 'thisMonth',
    getDateRange: () => [startOfMonth(new Date()), endOfMonth(new Date())],
  },
  {
    label: 'Last Month',
    value: 'lastMonth',
    getDateRange: () => {
      const lastMonth = subDays(startOfMonth(new Date()), 1);
      return [startOfMonth(lastMonth), endOfMonth(lastMonth)];
    },
  },
  {
    label: 'Custom Range',
    value: 'custom',
    getDateRange: () => [new Date(), new Date()],
  },
];

const AnalyticsPage: React.FC = () => {
  const [selectedRange, setSelectedRange] = useState<DateRange>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting analytics data...');
  };

  const getSelectedDateRange = (): [Date, Date] => {
    if (selectedRange === 'custom') {
      return [new Date(customStartDate), new Date(customEndDate)];
    }
    const option = dateRangeOptions.find((opt) => opt.value === selectedRange);
    return option ? option.getDateRange() : [new Date(), new Date()];
  };

  const [startDate, endDate] = getSelectedDateRange();

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">Recruitment Analytics</h1>
        <div className="d-flex gap-2">
          <div className="input-group">
            <select
              className="form-select"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value as DateRange)}
            >
              {dateRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {selectedRange === 'custom' && (
            <div className="d-flex gap-2">
              <input
                type="date"
                className="form-control"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <input
                type="date"
                className="form-control"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}
          <button className="btn btn-primary" onClick={handleExport}>
            <i className="fas fa-download mr-2"></i>
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Applications
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {isLoading ? '...' : '245'}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-users fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-left-success shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Hired Candidates
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {isLoading ? '...' : '12'}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-left-info shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Average Time to Hire
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {isLoading ? '...' : '23 days'}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-clock fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card border-left-warning shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Active Jobs
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {isLoading ? '...' : '18'}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-briefcase fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row">
        {/* Hiring Funnel */}
        <div className="col-xl-6 mb-4">
          <div className="card shadow">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Hiring Funnel</h6>
            </div>
            <div className="card-body">
              <HiringFunnelChart startDate={startDate} endDate={endDate} />
            </div>
          </div>
        </div>

        {/* Recruiter Metrics */}
        <div className="col-xl-6 mb-4">
          <div className="card shadow">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Recruiter Performance</h6>
            </div>
            <div className="card-body">
              <RecruiterMetricsChart startDate={startDate} endDate={endDate} />
            </div>
          </div>
        </div>

        {/* Source Effectiveness */}
        <div className="col-xl-6 mb-4">
          <div className="card shadow">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Source Effectiveness</h6>
            </div>
            <div className="card-body">
              <SourceEffectivenessChart startDate={startDate} endDate={endDate} />
            </div>
          </div>
        </div>

        {/* Time to Hire */}
        <div className="col-xl-6 mb-4">
          <div className="card shadow">
            <div className="card-header py-3">
              <h6 className="m-0 font-weight-bold text-primary">Time to Hire Trends</h6>
            </div>
            <div className="card-body">
              <TimeToHireChart startDate={startDate} endDate={endDate} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage; 