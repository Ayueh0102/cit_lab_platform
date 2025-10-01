from flask import Blueprint, request, jsonify
from src.models.user import db, Event, EventRegistration, User
from src.routes.auth import token_required
from datetime import datetime

events_bp = Blueprint('events', __name__)

@events_bp.route('/events', methods=['GET'])
@token_required
def get_events(current_user):
    try:
        events = Event.query.order_by(Event.start_time.asc()).all()
        return jsonify([event.to_dict() for event in events]), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch events: {str(e)}'}), 500

@events_bp.route('/events', methods=['POST'])
@token_required
def create_event(current_user):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'start_time']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'{field} is required'}), 400
        
        # Parse datetime strings
        start_time = datetime.fromisoformat(data['start_time'].replace('Z', '+00:00'))
        end_time = None
        if data.get('end_time'):
            end_time = datetime.fromisoformat(data['end_time'].replace('Z', '+00:00'))
        
        registration_deadline = None
        if data.get('registration_deadline'):
            registration_deadline = datetime.fromisoformat(data['registration_deadline'].replace('Z', '+00:00'))
        
        event = Event(
            title=data['title'],
            description=data.get('description'),
            start_time=start_time,
            end_time=end_time,
            location=data.get('location'),
            capacity=data.get('capacity'),
            registration_deadline=registration_deadline,
            created_by=current_user.id
        )
        
        db.session.add(event)
        db.session.commit()
        
        return jsonify({
            'id': event.id,
            'message': 'Event created successfully'
        }), 201
        
    except ValueError as e:
        return jsonify({'message': f'Invalid datetime format: {str(e)}'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create event: {str(e)}'}), 500

@events_bp.route('/events/<int:event_id>', methods=['GET'])
@token_required
def get_event(current_user, event_id):
    try:
        event = Event.query.get_or_404(event_id)
        return jsonify(event.to_dict()), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch event: {str(e)}'}), 500

@events_bp.route('/events/<int:event_id>/register', methods=['POST'])
@token_required
def register_for_event(current_user, event_id):
    try:
        event = Event.query.get_or_404(event_id)
        
        # Check if registration deadline has passed
        if event.registration_deadline and datetime.utcnow() > event.registration_deadline:
            return jsonify({'message': 'Registration deadline has passed'}), 400
        
        # Check if event is at capacity
        if event.capacity and event.registrations.count() >= event.capacity:
            return jsonify({'message': 'Event is at full capacity'}), 400
        
        # Check if user is already registered
        existing_registration = EventRegistration.query.filter_by(
            event_id=event_id,
            user_id=current_user.id
        ).first()
        
        if existing_registration:
            return jsonify({'message': 'Already registered for this event'}), 400
        
        # Create registration
        registration = EventRegistration(
            event_id=event_id,
            user_id=current_user.id
        )
        
        db.session.add(registration)
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully registered for the event',
            'registration_id': registration.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to register for event: {str(e)}'}), 500

@events_bp.route('/events/<int:event_id>/unregister', methods=['DELETE'])
@token_required
def unregister_from_event(current_user, event_id):
    try:
        registration = EventRegistration.query.filter_by(
            event_id=event_id,
            user_id=current_user.id
        ).first()
        
        if not registration:
            return jsonify({'message': 'Not registered for this event'}), 400
        
        db.session.delete(registration)
        db.session.commit()
        
        return jsonify({'message': 'Successfully unregistered from the event'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to unregister from event: {str(e)}'}), 500

@events_bp.route('/events/<int:event_id>/registrations', methods=['GET'])
@token_required
def get_event_registrations(current_user, event_id):
    try:
        event = Event.query.get_or_404(event_id)
        
        # Only event creator or admin can view registrations
        if event.created_by != current_user.id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        registrations = EventRegistration.query.filter_by(event_id=event_id).all()
        
        return jsonify([{
            'id': reg.id,
            'user': reg.user.to_dict(),
            'registered_at': reg.created_at.isoformat() if reg.created_at else None
        } for reg in registrations]), 200
        
    except Exception as e:
        return jsonify({'message': f'Failed to fetch registrations: {str(e)}'}), 500
