from flask import render_template, jsonify
from app.main import bp
from app.services.gis_service import GISService

gis_service = GISService()

@bp.route('/')
@bp.route('/index')
def index():
    return render_template('pages/map_view.html')

@bp.route('/split-view')
def split_view():
    return render_template('pages/split_view.html')

@bp.route('/api/features/<feature_type>')
def get_features(feature_type):
    features = gis_service.get_features(feature_type)
    return jsonify([{
        'type': 'Feature',
        'geometry': f.geometry,
        'properties': f.properties,
        'id': f.id
    } for f in features])

@bp.route('/api/features/<feature_type>/<feature_id>')
def get_feature(feature_type, feature_id):
    feature = gis_service.get_feature_by_id(feature_type, feature_id)
    if feature:
        return jsonify({
            'type': 'Feature',
            'geometry': feature.geometry,
            'properties': feature.properties,
            'id': feature.id
        })
    return jsonify({'error': 'Feature not found'}), 404
