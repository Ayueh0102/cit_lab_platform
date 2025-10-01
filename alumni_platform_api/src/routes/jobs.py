from flask import Blueprint, request, jsonify
from src.models.user import db, Job, JobRequest, User, Conversation, ConversationParticipant, Message
from src.routes.auth import token_required

jobs_bp = Blueprint('jobs', __name__)

@jobs_bp.route('/jobs', methods=['GET'])
@token_required
def get_jobs(current_user):
    try:
        jobs = Job.query.order_by(Job.created_at.desc()).all()
        return jsonify([job.to_dict() for job in jobs]), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch jobs: {str(e)}'}), 500

@jobs_bp.route('/jobs', methods=['POST'])
@token_required
def create_job(current_user):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'description', 'company']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'{field} is required'}), 400
        
        job = Job(
            user_id=current_user.id,
            title=data['title'],
            description=data['description'],
            company=data['company'],
            location=data.get('location'),
            salary_range=data.get('salary_range')
        )
        
        db.session.add(job)
        db.session.commit()
        
        return jsonify({
            'id': job.id,
            'message': 'Job created successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create job: {str(e)}'}), 500

@jobs_bp.route('/jobs/<int:job_id>', methods=['GET'])
@token_required
def get_job(current_user, job_id):
    try:
        job = Job.query.get_or_404(job_id)
        return jsonify(job.to_dict()), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch job: {str(e)}'}), 500

@jobs_bp.route('/jobs/<int:job_id>/request', methods=['POST'])
@token_required
def request_job_exchange(current_user, job_id):
    try:
        job = Job.query.get_or_404(job_id)
        
        # Check if user is trying to request their own job
        if job.user_id == current_user.id:
            return jsonify({'message': 'Cannot request exchange for your own job'}), 400
        
        # Check if request already exists
        existing_request = JobRequest.query.filter_by(
            job_id=job_id,
            requester_id=current_user.id
        ).first()
        
        if existing_request:
            return jsonify({'message': 'Request already exists'}), 400
        
        # Create new request
        job_request = JobRequest(
            job_id=job_id,
            requester_id=current_user.id
        )
        
        db.session.add(job_request)
        db.session.commit()
        
        return jsonify({
            'request_id': job_request.id,
            'status': 'pending',
            'message': 'Exchange request sent successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to create request: {str(e)}'}), 500

@jobs_bp.route('/job-requests/received', methods=['GET'])
@token_required
def get_received_requests(current_user):
    try:
        # Get requests for jobs posted by current user
        requests = db.session.query(JobRequest).join(Job).filter(
            Job.user_id == current_user.id,
            JobRequest.status == 'pending'
        ).all()
        
        return jsonify([request.to_dict() for request in requests]), 200
    except Exception as e:
        return jsonify({'message': f'Failed to fetch requests: {str(e)}'}), 500

@jobs_bp.route('/job-requests/<int:request_id>', methods=['PUT'])
@token_required
def respond_to_request(current_user, request_id):
    try:
        job_request = JobRequest.query.get_or_404(request_id)
        
        # Verify that current user owns the job
        if job_request.job.user_id != current_user.id:
            return jsonify({'message': 'Unauthorized'}), 403
        
        data = request.get_json()
        status = data.get('status')
        
        if status not in ['approved', 'rejected']:
            return jsonify({'message': 'Status must be approved or rejected'}), 400
        
        job_request.status = status
        
        conversation_id = None
        
        # If approved, create a conversation between the two users
        if status == 'approved':
            conversation = Conversation()
            db.session.add(conversation)
            db.session.flush()  # Get the ID
            
            # Add participants
            participant1 = ConversationParticipant(
                conversation_id=conversation.id,
                user_id=current_user.id
            )
            participant2 = ConversationParticipant(
                conversation_id=conversation.id,
                user_id=job_request.requester_id
            )
            
            db.session.add(participant1)
            db.session.add(participant2)
            
            # Add system message
            system_message = Message(
                conversation_id=conversation.id,
                sender_id=current_user.id,
                content=f"[系統訊息] {current_user.name} 已同意您關於「{job_request.job.title}」職缺的交流請求。您們現在可以開始對話了。雙方的聯絡資訊也已交換。"
            )
            db.session.add(system_message)
            
            conversation_id = conversation.id
        
        db.session.commit()
        
        response_data = {
            'message': f'Request {status} successfully'
        }
        
        if conversation_id:
            response_data['conversation_id'] = conversation_id
        
        return jsonify(response_data), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to respond to request: {str(e)}'}), 500
