import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Timer from '../components/Timer';

// Mock timers
jest.useFakeTimers();

describe('Timer Component', () => {
  test('renders timer with initial duration', () => {
    const duration = 3600; // 1 hour in seconds
    const onTimeUp = jest.fn();

    render(<Timer duration={duration} onTimeUp={onTimeUp} />);

    expect(screen.getByText('01:00:00')).toBeInTheDocument();
  });

  test('counts down correctly', () => {
    const duration = 10; // 10 seconds
    const onTimeUp = jest.fn();

    render(<Timer duration={duration} onTimeUp={onTimeUp} />);

    expect(screen.getByText('00:00:10')).toBeInTheDocument();

    // Fast-forward 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByText('00:00:09')).toBeInTheDocument();
  });

  test('calls onTimeUp when timer reaches zero', () => {
    const duration = 2; // 2 seconds
    const onTimeUp = jest.fn();

    render(<Timer duration={duration} onTimeUp={onTimeUp} />);

    // Fast-forward past the duration
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(onTimeUp).toHaveBeenCalled();
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  test('displays warning style when time is low', () => {
    const duration = 30; // 30 seconds
    const onTimeUp = jest.fn();

    render(<Timer duration={duration} onTimeUp={onTimeUp} />);

    // Fast-forward to warning time (less than 5 minutes)
    act(() => {
      jest.advanceTimersByTime(25000); // 25 seconds passed, 5 seconds left
    });

    const timerElement = screen.getByText('00:00:05');
    expect(timerElement).toHaveClass('warning'); // Assuming warning class exists
  });

  test('pauses and resumes correctly', () => {
    const duration = 10;
    const onTimeUp = jest.fn();

    const { rerender } = render(
      <Timer duration={duration} onTimeUp={onTimeUp} isPaused={false} />
    );

    // Timer should be running
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('00:00:09')).toBeInTheDocument();

    // Pause the timer
    rerender(<Timer duration={duration} onTimeUp={onTimeUp} isPaused={true} />);

    // Time should not advance when paused
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('00:00:09')).toBeInTheDocument();
  });
});